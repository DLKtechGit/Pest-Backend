const express = require("express");
const router = express.Router();
const Task = require("../../Models/AdminSchema/TaskSchema");
const Customer = require("../../Models/AdminSchema/CompanySchema");
const puppeteer = require("puppeteer");
const moment = require("moment");
const { writeFile } = require("fs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { log } = require("console");


router.post("/createTask", async (req, res) => {
    try {
        const { customerId, technicianId, taskDetails } = req.body;
        const existingTask = await Task.findOne({
            customerId: customerId,
            "technicians.technicianId": technicianId,
        });

        // console.log("v----------------->",taskDetails);

        if (existingTask) {
            const technicianIndex = existingTask.technicians.findIndex(
                (t) => t.technicianId.toString() === technicianId
            );
            existingTask.technicians[technicianIndex].tasks.push({
                ...taskDetails,
                technicianDetails: await Customer.findById(technicianId),
            });
            await existingTask.save();
            res
                .status(200)
                .json({ message: "Task added successfully", task: existingTask });
        } else {
            const customerDetails = await Customer.findById(customerId);
            const technicianDetails = await Customer.findById(technicianId);

            const newTask = new Task({
                customerId: customerId,
                customerDetails: customerDetails,
                technicians: [
                    {
                        technicianId: technicianId,
                        tasks: taskDetails
                            ? [{ ...taskDetails, technicianDetails: technicianDetails }]
                            : [],
                    },
                ],
            });
            const savedTask = await newTask.save();
            res
                .status(201)
                .json({ message: "Task created successfully", task: savedTask });
        }
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/getTasks", async (req, res) => {
    var result = await Task.find();
    // console.log("result====>", result);
    res.statusMessage = "Technician Data fetched successfully...";
    res.status(200).json({
        Length: result.length,
        Results: result,
    });
});

router.post("/updateSkipStatus", async (req, res) => {
    try {
        const { taskItemId, taskId, status, skip, subcatId } = req.body;
        // console.log("req.body", req.body);
        const taskToUpdate = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.QrCodeCategory.subCategoryStatus._id": subcatId
        });

        if (!taskToUpdate) {
            return res.status(404).json({ error: "Task not found" });
        }

        const technicianIndex = taskToUpdate.technicians.findIndex((tech) =>
            tech.tasks.some((task) => task._id.equals(taskItemId))
        );

        if (technicianIndex === -1) {
            return res.status(404).json({ error: "Technician not found" });
        }

        const taskIndex = taskToUpdate.technicians[technicianIndex].tasks.findIndex(
            (task) => task._id.equals(taskItemId)
        );

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const qrDetail = taskToUpdate.technicians[technicianIndex].tasks[taskIndex].QrCodeCategory.find(
            (QrCodeCategory) => QrCodeCategory.subCategoryStatus.some((title) => String(title._id) === String(subcatId))
        );
        // console.log("qrDetail", qrDetail);
        if (!qrDetail) {
            return res.status(404).json({ error: "QR code details not found" });
        }

        const titleIndex = qrDetail.subCategoryStatus.findIndex((title) => String(title._id) === String(subcatId));

        if (titleIndex === -1) {
            return res.status(404).json({ error: "QR code not found" });
        }

        qrDetail.subCategoryStatus[titleIndex].status = status;
        qrDetail.subCategoryStatus[titleIndex].skip = skip;

        await taskToUpdate.save();

        res.status(200).json({
            message: "QR code status updated successfully",
            updatedTask: taskToUpdate,
        });
    } catch (error) {
        console.error("Error updating QR code status:", error);
        res.status(500).json({ error: "Server error" });
    }
});


router.get("/getTasksbystart", async (req, res) => {
    try {
        const startTasks = await Task.find({
            "technicians.tasks.status": { $in: ["start", "ongoing"] }
        });
        res.status(200).json({
            Length: startTasks.length,
            Results: startTasks
        });
    } catch (error) {
        console.error("Error fetching tasks by status:", error);
        res.status(500).json({ error: "Server error" });
    }
});


router.get("/getTask/:taskId", async (req, res) => {
    const taskId = req.params.taskId; 
  
    try {
      const task = await Task.findOne({ "technicians.tasks._id": taskId });
  
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      res.status(200).json({ task: task});
  
      console.log('result',task);
  
    } catch (error) {
      console.error("Error fetching task item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

router.get("/getcompletedTasks/:_id/:taskItemId", async (req, res) => {
    const { technicianId, taskItemId } = req.params;
    try {
        const result = await Task.findOne({
            "technicians": {
                $elemMatch: {
                    "technicianId": technicianId,
                    "tasks": {
                        $elemMatch: {
                            "_id": taskItemId,
                            "status": "completed"
                        }
                    }
                }
            }
        });

        if (!result) {
            return res.status(404).json({ message: "Completed task not found" });
        }

        // Extract the specific completed task from the result
        const technician = result.technicians.find(t => t.technicianId === technicianId);
        if (!technician) {
            return res.status(404).json({ message: "Technician not found" });
        }

        const completedTask = technician.tasks.find(task => task._id.equals(taskItemId));
        if (!completedTask || completedTask.status !== "completed") {
            return res.status(404).json({ message: "Completed task not found" });
        }

        res.statusMessage = "Completed task fetched successfully.";
        res.status(200).json({
            Result: completedTask,
        });
    } catch (error) {
        console.error("Error fetching completed task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/updateTaskOtherTechnicianName", async (req, res) => {
    try {
        const { taskId, taskItemId, otherTechnicianName } = req.body;

        const task = await Task.findById(taskId);

        if (!task) {
            console.log("Task not found");
            return res.status(404).json({ error: "Task not found" });
        }

        const taskItem = task.technicians
            .flatMap((technician) => technician.tasks)
            .find((task) => task._id.toString() === taskItemId);

        if (!taskItem) {
            console.log("Task item not found");
            return res.status(404).json({ error: "Task item not found" });
        }

        taskItem.otherTechnicianName = otherTechnicianName;

        const updatedTask = await task.save();

        res.status(200).json({
            message: "Other technician name updated successfully",
            task: updatedTask,
        });
    } catch (error) {
        console.error("Error updating other technician name:", error);
        res.status(500).json({ error: "Server error" });
    }
});
router.post("/updateRodentStatusMain", async (req, res) => {
    try {
        const {
            taskItemId,
            taskId,
            Rodentstatus,
            qrId
        } = req.body;


        const findTaskToUpdate = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.status": { $ne: "completed" },
            "technicians.tasks.qrDetails.titles": {
                $elemMatch: {
                    title: qrId,
                    skip: true,
                    qrScanned: true
                }
            }
        });

        if (findTaskToUpdate) {
            return res.status(404).json({ error: findTaskToUpdate });
        }

        const taskToUpdate = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
        });

        if (!taskToUpdate) {
            return res.status(404).json({ error: "Task not found" });
        }

        const technicianIndex = taskToUpdate.technicians.findIndex((tech) =>
            tech.tasks.some((task) => task._id.equals(taskItemId))
        );

        if (technicianIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const taskIndex = taskToUpdate.technicians[technicianIndex].tasks.findIndex(
            (task) => task._id.equals(taskItemId)
        );

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        // Optionally, update other fields such as status, startDate, etc.
        taskToUpdate.technicians[technicianIndex].tasks[taskIndex].Rodentstatus = Rodentstatus;

        await taskToUpdate.save();

        res.status(200).json({
            message: "Task status and completed details updated successfully",
            updatedTask: taskToUpdate,
        });
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/updateRodentSkipStatus", async (req, res) => {
    try {
        const { taskItemId, taskId, rodentId, skip, qrScanned } = req.body;

        const updatedTask = await Task.findOneAndUpdate(
            {
                _id: taskId,
                "technicians.tasks._id": taskItemId,
                "technicians.tasks.qrDetails.titles._id": rodentId
            },
            {
                $set: {
                    "technicians.$[tech].tasks.$[task].qrDetails.$[qrDetail].titles.$[title].skip": skip,
                    "technicians.$[tech].tasks.$[task].qrDetails.$[qrDetail].titles.$[title].qrScanned": qrScanned
                }
            },
            {
                arrayFilters: [
                    { "tech.tasks._id": taskItemId },
                    { "task._id": taskItemId },
                    { "qrDetail.titles._id": rodentId },
                    { "title._id": rodentId }
                ],
                new: true // Return the updated document
            }
        );

        if (!updatedTask) {
            return res.status(404).json({ error: "Task not found or provided IDs do not match" });
        }

        res.status(200).json({
            message: "QR code status updated successfully",
            updatedTask
        });
    } catch (error) {
        console.error("Error updating QR code status:", error);
        res.status(500).json({ error: "Server error" });
    }
});


router.post("/getRodentSkipStatusFalse", async (req, res) => {
    try {
        const { taskItemId } = req.body;

        const tasksWithRodentPro = await Task.find({
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.qrDetails.serviceName": "Rodent Pro",
        });

        if (!tasksWithRodentPro || tasksWithRodentPro.length === 0) {
            return res.status(404).json({ error: `No tasks found with the provided taskItemId '${taskItemId}', serviceName 'Rodent Pro', and skip 'false'` });
        }

        const qrDetailsWithRodentPro = tasksWithRodentPro.flatMap(task =>
            task.technicians.flatMap(tech =>
                tech.tasks.filter(task => task._id.toString() === taskItemId)
                    .flatMap(task => // Added missing flatMap
                        task.qrDetails.filter(qrDetails =>
                            qrDetails.serviceName === "Rodent Pro" &&
                            qrDetails.titles.some(title => title.skip === false && !title.qrScanned)
                        ).map(qrDetails => ({
                            titles: qrDetails.titles.filter(title => title.skip === false && !title.qrScanned)
                        }))
                    )
            )
        );


        // console.log("qrDetailsWithRodentPro", qrDetailsWithRodentPro);

        res.status(200).json({
            qrDetails: qrDetailsWithRodentPro
        });
    } catch (error) {
        console.error("Error retrieving tasks with false status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/getRodentQrTrue", async (req, res) => {
    try {
        const { taskItemId } = req.body;

        const tasksWithRodentPro = await Task.find({
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.qrDetails.serviceName": "Rodent Pro",
        });

        if (!tasksWithRodentPro || tasksWithRodentPro.length === 0) {
            return res.status(404).json({ error: `No tasks found with the provided taskItemId '${taskItemId}', serviceName 'Rodent Pro', and skip 'false'` });
        }

        const qrDetailsWithRodentPro = tasksWithRodentPro.flatMap(task =>
            task.technicians.flatMap(tech =>
                tech.tasks.filter(task => task._id.toString() === taskItemId)
                    .flatMap(task =>
                        task.qrDetails.filter(qrDetails =>
                            qrDetails.serviceName === "Rodent Pro" &&
                            qrDetails.titles.some(title => title.qrScanned === true)
                        ).map(qrDetails => ({
                            titles: qrDetails.titles.filter(title => title.qrScanned === true).slice(0, 1)
                        }))
                    )
            )
        );

        res.status(200).json({
            qrDetails: qrDetailsWithRodentPro
        });
    } catch (error) {
        console.error("Error retrieving tasks with false status:", error);
        res.status(500).json({ error: "Server error" });
    }
});


router.post("/updateTaskStatus", async (req, res) => {
    try {
        const {
            taskItemId,
            taskId,
            status,
            technicianStartDate,
            technicianStartTime,
            pauseReason,
            titleId,
            taskItemStatus,
        } = req.body;

        const taskToUpdate = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
        });

        if (!taskToUpdate) {
            return res.status(404).json({ error: "Task not found" });
        }

        const technicianIndex = taskToUpdate.technicians.findIndex((tech) =>
            tech.tasks.some((task) => task._id.equals(taskItemId))
        );

        if (technicianIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const taskIndex = taskToUpdate.technicians[technicianIndex].tasks.findIndex(
            (task) => task._id.equals(taskItemId)
        );

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        // Find the QR detail containing the specified titleId
        const qrDetailContainingTitle = taskToUpdate.technicians[technicianIndex].tasks[taskIndex].qrDetails.find(
            (qrDetail) => qrDetail.titles.some((title) => title._id.equals(titleId))
        );

        if (!qrDetailContainingTitle) {
            return res.status(404).json({ error: "QR detail not found" });
        }

        const titleIndex = qrDetailContainingTitle.titles.findIndex(
            (title) => title._id.equals(titleId)
        );

        if (titleIndex === -1) {
            return res.status(404).json({ error: "Title not found" });
        }

        // Update the taskItemStatus of the specific title
        qrDetailContainingTitle.titles[titleIndex].taskItemStatus = taskItemStatus;

        // Optionally, update other fields such as status, startDate, etc.
        taskToUpdate.technicians[technicianIndex].tasks[taskIndex].status = status;
        taskToUpdate.technicians[technicianIndex].tasks[taskIndex].technicianStartDate = technicianStartDate;
        taskToUpdate.technicians[technicianIndex].tasks[taskIndex].technicianStartTime = technicianStartTime;
        taskToUpdate.technicians[technicianIndex].tasks[taskIndex].pauseReason = pauseReason;

        await taskToUpdate.save();

        res.status(200).json({
            message: "Task status and completed details updated successfully",
            updatedTask: taskToUpdate,
        });
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/getTaskStatus/:taskItemId", async (req, res) => {
    try {
        const { taskId, taskItemId } = req.params;

        const task = await Task.findOne({
            //_id: taskId,
            "technicians.tasks._id": taskItemId,
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        const technicianIndex = task.technicians.findIndex((tech) =>
            tech.tasks.some((task) => task._id.equals(taskItemId))
        );

        if (technicianIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const taskIndex = task.technicians[technicianIndex].tasks.findIndex(
            (task) => task._id.equals(taskItemId)
        );

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const selectedTask = task.technicians[technicianIndex].tasks[taskIndex];

        res.status(200).json({ selectedTask });
    } catch (error) {
        console.error("Error fetching task:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/updateQrscannedStatus", async (req, res) => {
    try {
        const { taskItemId, taskId, qrScanned, qrId } = req.body;


        const findTaskToUpdate = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.status": { $ne: "completed" },
            "technicians.tasks.qrDetails.titles": {
                $elemMatch: {
                    title: qrId,
                    //skip: true,
                    qrScanned: true
                }
            }
        });

        if (findTaskToUpdate) {
            return res.status(404).json({ error: "This QR code has been already skipped." });
        }

        const taskToUpdate = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.qrDetails.titles.title": qrId
        });

        if (!taskToUpdate) {
            return res.status(404).json({ error: "Task not found" });
        }

        const technicianIndex = taskToUpdate.technicians.findIndex((tech) =>
            tech.tasks.some((task) => task._id.equals(taskItemId))
        );

        if (technicianIndex === -1) {
            return res.status(404).json({ error: "Technician not found" });
        }

        const taskIndex = taskToUpdate.technicians[technicianIndex].tasks.findIndex(
            (task) => task._id.equals(taskItemId)
        );

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const qrDetailsIndex = taskToUpdate.technicians[technicianIndex].tasks[taskIndex].qrDetails.findIndex(
            (qrDetail) => qrDetail.titles.some((title) => title.title === qrId)
        );

        if (qrDetailsIndex === -1) {
            return res.status(404).json({ error: "QR code details not found" });
        }

        const titleIndex = taskToUpdate.technicians[technicianIndex].tasks[taskIndex].qrDetails[qrDetailsIndex].titles.findIndex(
            (title) => title.title === qrId
        );

        if (titleIndex === -1) {
            return res.status(404).json({ error: "QR code not found" });
        }

        // Update the qrScanned property of the specific title (QR code)
        taskToUpdate.technicians[technicianIndex].tasks[taskIndex].qrDetails[qrDetailsIndex].titles[titleIndex].qrScanned = qrScanned;

        await taskToUpdate.save();

        res.status(200).json({
            message: "QR code status updated successfully",
            updatedTask: taskToUpdate,
        });
    } catch (error) {
        console.error("Error updating QR code status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/updateSubCategoryStatus", async (req, res) => {
    try {
        const { taskItemId, taskId, status, subcatId } = req.body;
        // console.log("req.body", req.body);
        const taskToUpdate = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.QrCodeCategory.subCategoryStatus._id": subcatId
        });

        if (!taskToUpdate) {
            return res.status(404).json({ error: "Task not found" });
        } 
 
        const technicianIndex = taskToUpdate.technicians.findIndex((tech) =>
            tech.tasks.some((task) => task._id.equals(taskItemId))
        );

        if (technicianIndex === -1) {
            return res.status(404).json({ error: "Technician not found" });
        }

        const taskIndex = taskToUpdate.technicians[technicianIndex].tasks.findIndex(
            (task) => task._id.equals(taskItemId)
        );

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const qrDetail = taskToUpdate.technicians[technicianIndex].tasks[taskIndex].QrCodeCategory.find(
            (QrCodeCategory) => QrCodeCategory.subCategoryStatus.some((title) => String(title._id) === String(subcatId))
        );
        // console.log("qrDetail", qrDetail);
        if (!qrDetail) {
            return res.status(404).json({ error: "QR code details not found" });
        }

        const titleIndex = qrDetail.subCategoryStatus.findIndex((title) => String(title._id) === String(subcatId));

        if (titleIndex === -1) {
            return res.status(404).json({ error: "QR code not found" });
        }

        qrDetail.subCategoryStatus[titleIndex].status = status;

        await taskToUpdate.save();

        res.status(200).json({
            message: "QR code status updated successfully",
            updatedTask: taskToUpdate,
        });
    } catch (error) {
        console.error("Error updating QR code status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/updateNoQRSubCategoryStatus", async (req, res) => {
    try {
        const { taskId, taskItemId, nosubcatId, status } = req.body;

        const taskToUpdate = await Task.findOneAndUpdate(
            {
                _id: taskId,
                "technicians.tasks._id": taskItemId,
                "technicians.tasks.noqrcodeService._id": nosubcatId
            },
            {
                $set: {
                    "technicians.$[tech].tasks.$[task].noqrcodeService.$[qr].status": status
                }
            },
            {
                arrayFilters: [
                    { "tech.tasks._id": taskItemId },
                    { "task._id": taskItemId },
                    { "qr._id": nosubcatId }
                ],
                new: true
            }
        );

        if (!taskToUpdate) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.status(200).json({
            message: "QR code status updated successfully",
            updatedTask: taskToUpdate,
        });
    } catch (error) {
        console.error("Error updating QR code status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/getNoSubCategoryFalseStatus", async (req, res) => {
    try {
        const tasksWithFalseStatus = await Task.find({
            "technicians.tasks.noqrcodeService.status": false
        });

        if (!tasksWithFalseStatus || tasksWithFalseStatus.length === 0) {
            return res.status(404).json({ error: "No tasks found with noqrcodeService status 'false'" });
        }

        const NosubCategoryStatusWithFalseStatus = tasksWithFalseStatus.flatMap(task =>
            task.technicians.flatMap(tech =>
                tech.tasks.flatMap(task =>
                    task.noqrcodeService.filter(noqrcode =>
                        noqrcode.status === false
                    )
                )
            )
        );

        if (NosubCategoryStatusWithFalseStatus.length === 0) {
            return res.status(404).json({ error: "No subCategoryStatus found with status 'false'" });
        }

        res.status(200).json({
            NosubCategoryStatusWithFalseStatus
        });
    } catch (error) {
        console.error("Error retrieving subCategoryStatus with false status:", error);
        res.status(500).json({ error: "Server error" }); 
    }
});

router.post("/getGeneralFalseStatus", async (req, res) => {
    try {
        const { taskItemId } = req.body;

        const tasksWithGeneralPestControl = await Task.find({
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.QrCodeCategory.category": "General Pest Control", 
        });

        // console.log("tasksWithGeneralPestControl", tasksWithGeneralPestControl);
 
        if (!tasksWithGeneralPestControl || tasksWithGeneralPestControl.length === 0) {
            return res.status(404).json({ error: `No tasks found with the provided taskItemId '${taskItemId}' and serviceName 'General Pest Control'` });
        }
 
        const subCategoryStatusWithFalseStatus = tasksWithGeneralPestControl.flatMap(task =>
            task.technicians.flatMap(tech =>
                tech.tasks.filter(task => task._id.toString() === taskItemId)
                    .flatMap(task =>
                        // console.log("task",task)
                        task.QrCodeCategory.filter(qrCodeCategory =>
                            qrCodeCategory.category === "General Pest Control"
                        ).flatMap(filteredCategory =>
                            // console.log("task", filteredCategory)
                            filteredCategory.subCategoryStatus.filter(status => status.status === false)
                        )
                    )
            )
        );

        res.status(200).json({
            subCategoryStatusWithFalseStatus
        });
    } catch (error) {
        console.error("Error retrieving tasks with false status:", error);
        res.status(500).json({ error: "Server error" });
    }
});


router.post("/getGeneraltrueStatus", async (req, res) => {
    try {
        const { taskItemId } = req.body;

        const tasksWithRodentPro = await Task.find({
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.QrCodeCategory.category": "General Pest Control",
        });

        if (!tasksWithRodentPro || tasksWithRodentPro.length === 0) {
            return res.status(404).json({ error: `No tasks found with the provided taskItemId '${taskItemId}', serviceName 'Rodent Pro', and skip 'false'` });
        }

        const subCategoryStatusWithFalseStatus = tasksWithRodentPro.flatMap(task =>
            task.technicians.flatMap(tech =>
                tech.tasks.filter(task => task._id.toString() === taskItemId)
                    .flatMap(task =>
                        task.QrCodeCategory.filter(qrCodeCategory =>
                            qrCodeCategory.category === "General Pest Control" &&
                            qrCodeCategory.subCategoryStatus.some(status => status.status === true && !status.skip)
                        ).flatMap(filteredCategory =>
                            filteredCategory.subCategoryStatus.filter(status => status.status === true && !status.skip)
                        )
                    )
            )
        );

        res.status(200).json({
            subCategoryStatusWithFalseStatus
        });
    } catch (error) {
        console.error("Error retrieving tasks with false status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/getSubCategoryStatusWithFalseStatus", async (req, res) => {
    try {
        const tasksWithFalseStatus = await Task.find({
            "technicians.tasks.QrCodeCategory.subCategoryStatus.status": false
        });
        if (!tasksWithFalseStatus || tasksWithFalseStatus.length === 0) {
            const subCategoryStatusWithFalseStatus = tasksWithFalseStatus
            return res.status(404).json({ subCategoryStatusWithFalseStatus });
        }

        const subCategoryStatusWithFalseStatus = tasksWithFalseStatus.flatMap(task =>
            task.technicians.flatMap(tech =>
                tech.tasks.flatMap(task =>
                    task.QrCodeCategory.flatMap(qrCodeCategory =>
                        qrCodeCategory.subCategoryStatus.filter(status => status.status === false)
                    )
                )
            )
        );


        if (subCategoryStatusWithFalseStatus.length === 0) {
            return res.status(404).json({ error: "No subCategoryStatus found with status 'false'" });
        }

        res.status(200).json({
            subCategoryStatusWithFalseStatus
        });
    } catch (error) {
        console.error("Error retrieving subCategoryStatus with false status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/updateQrCodeCompletedStatus", async (req, res) => {
    try {
        const { taskItemId, taskId, taskItemStatus, qrId } = req.body;
        // console.log("req.body", req.body);
        const taskToUpdate = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.qrDetails.titles._id": qrId
        });

        if (!taskToUpdate) {
            return res.status(404).json({ error: "Task not found" });
        }

        const technicianIndex = taskToUpdate.technicians.findIndex((tech) =>
            tech.tasks.some((task) => task._id.equals(taskItemId))
        );

        if (technicianIndex === -1) {
            return res.status(404).json({ error: "Technician not found" });
        }

        const taskIndex = taskToUpdate.technicians[technicianIndex].tasks.findIndex(
            (task) => task._id.equals(taskItemId)
        );

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const qrDetail = taskToUpdate.technicians[technicianIndex].tasks[taskIndex].qrDetails.find(
            (qrDetail) => qrDetail.titles.some((title) => String(title._id) === String(qrId))
        );

        if (!qrDetail) {
            return res.status(404).json({ error: "QR code details not found" });
        }

        const titleIndex = qrDetail.titles.findIndex((title) => String(title._id) === String(qrId));

        if (titleIndex === -1) {
            return res.status(404).json({ error: "QR code not found" });
        }

        qrDetail.titles[titleIndex].taskItemStatus = taskItemStatus;

        await taskToUpdate.save();

        res.status(200).json({
            message: "QR code status updated successfully",
            updatedTask: taskToUpdate,
        });
    } catch (error) {
        console.error("Error updating QR code status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/updateCompletedStatus", async (req, res) => {
    try {
        const { taskItemId, taskId, status, completedDetails, email } = req.body;
        const taskToUpdate = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
        });

        if (!taskToUpdate) {
            return res.status(404).json({ error: "Task not found" });
        }

        const technicianIndex = taskToUpdate.technicians.findIndex((tech) =>
            tech.tasks.some((task) => task._id.equals(taskItemId))
        );

        if (technicianIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const taskIndex = taskToUpdate.technicians[technicianIndex].tasks.findIndex(
            (task) => task._id.equals(taskItemId)
        );

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }
        const techSignBase64 = completedDetails.techSign.split(",")[1];
        let customerSignBase64 = "N/A";

        if (completedDetails.customerSign) {
            customerSignBase64 = completedDetails.customerSign.split(",")[1];
        }

        const CustomerName = taskToUpdate.customerDetails.name;

        const PhoneNumber = taskToUpdate.customerDetails.phoneNumber;

        const Address =
            taskToUpdate.customerDetails.address +
            ", " +
            taskToUpdate.customerDetails.city +
            ", " +
            taskToUpdate.customerDetails.country +
            ", " +
            taskToUpdate.customerDetails.state;

        const serviceName =
            taskToUpdate.technicians[technicianIndex].tasks[taskIndex].serviceName;

        const date = Date.now()
        const currentDate = moment(date).format("DD-MMM-YYYY");

        const StartDate = moment(
            taskToUpdate.technicians[technicianIndex].tasks[taskIndex].technicianStartDate,
            "YYYY-MM-DD"
        ).format("DD-MMM-YYYY");

        // console.log("StartDate", StartDate);
        const StartTime =
            taskToUpdate.technicians[technicianIndex].tasks[taskIndex]
                .technicianStartTime;

        const timeStamp = StartDate + StartTime;

        const Techsign =
            taskToUpdate.technicians[technicianIndex].tasks[taskIndex]
                .completedDetails.techSign;

        const QrCodeCategory = taskToUpdate.technicians[technicianIndex].tasks[taskIndex].QrCodeCategory.map(data => {
            return data.subCategoryStatus.map(item => {
                if (item.skip === true) {
                    return `${item.subCategory} (Skipped)`;
                } else {
                    return item.subCategory;
                }
            });
        });

        const TechnicianfirstName =
            taskToUpdate.technicians[technicianIndex].tasks[taskIndex]
                .technicianDetails.firstName;

        const TechnicianlastName =
            taskToUpdate.technicians[technicianIndex].tasks[taskIndex]
                .technicianDetails.lastName;

        const TechnicianName = TechnicianfirstName + " " + TechnicianlastName;

        const OtherTechnicianName =
            taskToUpdate.technicians[technicianIndex].tasks[taskIndex]
                .otherTechnicianName;


        taskToUpdate.technicians[technicianIndex].tasks[taskIndex].status = status
        // Update completedDetails
        taskToUpdate.technicians[technicianIndex].tasks[
            taskIndex
        ].completedDetails = {
            chemicalsName: completedDetails.chemicalsName,
            recommendation: completedDetails.recommendation,
            techSign: techSignBase64,
            customerAvailble: completedDetails.customerAvailble,
            customerSign: customerSignBase64,
            endTime: completedDetails.endTime
        };


        const header = `<!DOCTYPE html><html><head><title>Page Title</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><link href="https://fonts.googleapis.com/css?family=Poppins" rel="stylesheet"><style>html {-webkit-print-color-adjust: exact;}body{font-family: "Poppins";margin:0}.heading {background-color:#3A3A3A;color:white;font-weight:bold; width:100%;z-index: 1000;top:0;left:0;right:0}.heading td{padding-left:10px;}.logo{ text-align:end;padding-right:10px;}.date_head {font-size:14px;font-weight:normal;}.body_content{margin:10px;}.footer{background-color:#3A3A3A;color:white;padding:10px;left:0;right:0;bottom:0px; position: fixed;}.address{text-align:end; width:450px;text-align:left;}.mobile{width:250px;}.mail{width:300px;} .remarks{max-width: 150px;line-break: anywhere;}</style></head><body><table width="100%" cellpadding="0" cellspacing="0"><tr class="heading"><td>SERVICE REPORT <br /><span class="date_head">${currentDate}</span></td><td class="logo"><img src="http://localhost:4000/images/logo.png"/></td></tr><tr><td></td><td class="logo"><img src="http://localhost:4000/images/pest.svg" width="100px" /><img src="http://localhost:4000/images/BPCA.png" width="50px" /></td></tr></table>`;

        const body = `<center><table border="1" cellpadding="5" cellspacing="0" class="body_content" width="95%"><tr><th colspan=2>CUSTOMER INFORMATION</th><tr><tr><td><b>Name</b></td><td>${CustomerName}</td></tr><tr><td><b>Address</b></td><td>${Address}in</td></tr><tr><td><b>Mobile Number</b></td><td>${PhoneNumber}</td></tr> <tr><td><b>Service Type</b></td><td height="80px">${QrCodeCategory}${QrCodeCategory.includes("skip") ? " (Skipped)" : ""}</td></tr><tr><td><b>Chemical Used</b></td><td height="80px">${completedDetails.chemicalsName}</td></tr><tr><td><b>Start Time</b></td><td>${StartTime}</td></tr><tr><td><b>End Time</b></td><td>${completedDetails.endTime}</td></tr><tr><td><table><tr><td><div><b>Customer Sign</b></div><br /><div>${completedDetails.customerSign === "N/A" ? "N/A" : `<img src="data:image/png;base64,${customerSignBase64}" width="150px" />`}</div><div><b>Name:</b>   ${CustomerName}</div></td></table></td><td><table><tr><td><div><b>Technician Sign</b></div><br /><div><img src="data:image/png;base64,${techSignBase64}" width="150px" /></div><div><b>Name:</b>   ${TechnicianName}</div><div><b>Other Technician:</b>   ${OtherTechnicianName ? OtherTechnicianName : "N/A"}</div></td> </tr></table></td></tr><tr><td><b>Recommendation / Remarks</b></td><td height="150px" class="remarks">${completedDetails.recommendation}</td></tr></table></center>`;

        const footer =
            '<table width="100%"  cellpadding="0" cellspacing="0" class="footer"><tr><td class="mobile"><i class="fa fa-phone"></i> +973 17720648</td><td class="mail"><i class="fa fa-envelope" aria-hidden="true"></i> info@pestpatrolbh.com</td><td class="address"><i class="fa fa-map-marker" aria-hidden="true"></i> Flat 1, Building 679,Road 3519, Block 335. Um Al Hassam CR.No. 3121-6</td></tr></table></body></html>';
        const html = header + body + footer;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html);
        await page.addStyleTag({
            content: `
        .watermark {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.1;
            pointer-events: none;
            background-image: url('http://localhost:4000/images/logo_back.png');
            background-repeat: no-repeat;
            background-size: 50%;
            background-position: center;
        }
      `,
        });

        await page.evaluate(() => {
            const watermarkDiv = document.createElement("div");
            watermarkDiv.className = "watermark";
            document.body.appendChild(watermarkDiv);
        });
        const pdfBuffer = await page.pdf();
        await browser.close();
        //return pdfBuffer;
        //res.setHeader("Content-Type", "application/pdf");
        //res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
        //res.send(pdfBuffer);
        const randomNumber = crypto.randomInt(100000, 999999);
        const fileName = `${randomNumber}.pdf`;
        const full_fileName = `reports/${fileName}`;
        writeFile(full_fileName, pdfBuffer, {}, (err) => {
            if (err) {
                return console.error("error");
            }

            console.log("success!");
        });

        const pdfBase64 = pdfBuffer.toString("base64");

        taskToUpdate.technicians[technicianIndex].tasks[taskIndex].pdf = pdfBase64;

        await taskToUpdate.save();
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: "pestcontrol633@gmail.com",
                pass: "acof axql bhdv yats",
            },
        });

        const customer = await Customer.findOne({ email })
        if (!customer) {
            return res.status(404).json({ error: "Customr not found " })
        }

        const mailOptions = {
            from: "dlktechnologiesreact@gmail.com",
            to: email,
            subject: "Pest Patrol Service Report",
            html: `
            <p>Hi ${customer.name}, </p>

            <p> We're delighted to provide you with a summary of your recent service from Pest Patrol. The service report attached with this mail for your reference. </p>




            <p> If you have any questions or need further assistance, feel free to reply to this email. We're here to help! </p>
            
            <p>Wishing you a pest-free environment! </p>

            <img src="https://t4.ftcdn.net/jpg/04/84/47/27/240_F_484472702_acpl3SZTBwb2Al4ZiW8VusICp7Utl8ed.jpg" alt="Pest Patrol Logo" />

            <p>Warm regards,</p>
            <p>The Pest Patrol Team</p>

            `,
            attachments: [
                {
                    filename: fileName,
                    content: pdfBuffer
                }
            ]
        }
        await transporter.sendMail(mailOptions)
        console.log("Pest Patrol Service Reportemail sent successfully.")

        res.status(200).json({
            fullFileName: `http://localhost:4000/${full_fileName}`,
            fileName: fileName,
        });



    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ error });
    }
});

router.get("/completedTaskDetails/:taskId/:taskItemId", async (req, res) => {
    try {
        const { taskId, taskItemId } = req.params;

        const task = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        const technicianIndex = task.technicians.findIndex((tech) =>
            tech.tasks.some((task) => task._id.equals(taskItemId))
        );

        if (technicianIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const taskIndex = task.technicians[technicianIndex].tasks.findIndex(
            (task) => task._id.equals(taskItemId)
        );

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const taskDetails = {
            fullFileName: task.technicians[technicianIndex].tasks[taskIndex].pdf,
            // fileName: task.pdf,
            customerName: task.customerDetails.name,
            serviceName: task.technicians[technicianIndex].tasks[taskIndex].serviceName,
        };

        res.status(200).json(taskDetails);
    } catch (error) {
        console.error("Error retrieving task details:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;

router.get("/start/taskcount", async (req, res) => {
    try {
        const startCount = await Task.countDocuments({
            "technicians.tasks.status": "start",
        });

        res.status(200).json({
            start: startCount,
        });
    } catch (error) {
        console.error("Error counting tasks by status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/ongoing/taskcount", async (req, res) => {
    try {
        const ongoingCount = await Task.countDocuments({
            "technicians.tasks.status": "ongoing",
        });

        res.status(200).json({
            Ongoing: ongoingCount,
        });
    } catch (error) {
        console.error("Error counting tasks by status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/completed/taskcount", async (req, res) => {
    try {
        const taskItemId = req.query.taskItemId;
        const CompletedTask = await Task.countDocuments({
            "technicians.tasks": {
                $elemMatch: {
                    taskItemId: taskItemId,
                    status: "completed"
                }
            }
        });

        res.status(200).json({
            Completed: CompletedTask,
        });
    } catch (error) {
        console.error("Error counting tasks by status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/updatePausedetails", async (req, res) => {
    try {
        const {
            taskItemId,
            taskId,
            pauseReason,
            pauseTiming, // Added pause timing from the request body
            subCatId,
        } = req.body;

        const taskToUpdate = await Task.findOne({
            _id: taskId,
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.QrCodeCategory.subCategoryStatus._id": subCatId
        });

        if (!taskToUpdate) {
            return res.status(404).json({ error: "Task not found" });
        }

        const technicianIndex = taskToUpdate.technicians.findIndex((tech) =>
            tech.tasks.some((task) => task._id.equals(taskItemId))
        );

        if (technicianIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const taskIndex = taskToUpdate.technicians[technicianIndex].tasks.findIndex(
            (task) => task._id.equals(taskItemId)
        );

        if (taskIndex === -1) {
            return res.status(404).json({ error: "Task not found" });
        }

        const qrDetail = taskToUpdate.technicians[technicianIndex].tasks[taskIndex].QrCodeCategory.find(
            (QrCodeCategory) => QrCodeCategory.subCategoryStatus.some((title) => String(title._id) === String(subCatId))
        );

        if (!qrDetail) {
            return res.status(404).json({ error: "QR code details not found" });
        }

        const titleIndex = qrDetail.subCategoryStatus.findIndex((title) => String(title._id) === String(subCatId));

        if (titleIndex === -1) {
            return res.status(404).json({ error: "QR code not found" });
        }

        // Check if pause reason already exists
        const pauseDetailIndex = qrDetail.subCategoryStatus[titleIndex].pauseDetails.findIndex(
            (detail) => detail.pauseReason === pauseReason
        );

        if (pauseDetailIndex === -1) {
            // If pause reason doesn't exist, add it
            qrDetail.subCategoryStatus[titleIndex].pauseDetails.push({
                pauseReason,
                pauseTiming // Added pause timing to the pause details
            });
            await taskToUpdate.save();

            res.status(200).json({
                message: "Pause reason added successfully",
                updatedTask: taskToUpdate,
            });
        } else {
            res.status(400).json({ error: "Pause reason already exists" });
        }
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/getRodentStatus", async (req, res) => {
    try {
        const { taskItemId } = req.body;

        const tasksWithRodentPro = await Task.find({
            "technicians.tasks._id": taskItemId,
            "technicians.tasks.qrDetails.serviceName": "Rodent Pro",
        });

        if (!tasksWithRodentPro || tasksWithRodentPro.length === 0) {
            return res.status(404).json({ error: `No tasks found with the provided taskItemId '${taskItemId}', serviceName 'Rodent Pro'` });
        }

        const qrDetailsWithRodentPro = tasksWithRodentPro.flatMap(task =>
            task.technicians.flatMap(tech =>
                tech.tasks.filter(task => task._id.toString() === taskItemId)
                    .map(task => ({
                        Rodentstatus: task.Rodentstatus
                    }))
            )
        );

        res.status(200).json(
            qrDetailsWithRodentPro
        );
    } catch (error) {
        console.error("Error retrieving tasks:", error);
        res.status(500).json({ error: "Server error" });
    }
});


router.post("/getTaskByCustomerId", async (req, res) => {
    try {
      const { customeID, technicianID } = req.body;
  
      if (!customeID && !technicianID) {
        res.status(400).json({
          message: "Customer or Technician not found",
        });
      } else {
        const taskdata = await Task.find({
          customerId: customeID,
          technicians: { $elemMatch: { technicianId: technicianID } },
          
        });
  
        if (!taskdata) {
          res.status(404).json({
            message: "task not found",
          });
        }
  
        res.status(200).json({
          message: "Task fetched successfully",
          data: taskdata,
        });
      }
    } catch (error) {
      {
        console.error(error);
        res.status(500).json({
          message: "Internal Server Error",
        });
      }
    }
  });


module.exports = router; 
