const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { User, Task, CrossLog, Report } = require("../models/Schemas");

// 1. Lấy danh sách nhiệm vụ cho User (Ẩn link đã đủ 10 lượt tương tác)
router.get("/", async (req, res) => {
  try {
    // Chuyển string ID sang ObjectId để so sánh chuẩn xác trong MongoDB Aggregation
    const currentUserId = req.currentUser
      ? new mongoose.Types.ObjectId(req.currentUser._id)
      : null;

    const tasks = await Task.aggregate([
      {
        $lookup: {
          from: "crosslogs", // Tên collection của CrossLog model trong MongoDB
          localField: "_id",
          foreignField: "task_id",
          as: "interactions"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "creator"
        }
      },
      {
        $unwind: {
          path: "$creator",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          title: 1,
          url: 1,
          created_at: 1,
          creator_name: { $ifNull: ["$creator.username", "NĐT ẩn danh"] },
          total_interactions: { $size: "$interactions" },
          is_completed: {
            $in: [currentUserId, "$interactions.user_id"]
          }
        }
      },
      // CHỈ LẤY LINK DƯỚI 10 LƯỢT TƯƠNG TÁC
      { $match: { total_interactions: { $lt: 10 } } },
      { $sort: { created_at: -1 } }
    ]);

    res.json(tasks);
  } catch (err) {
    console.error("Lỗi lấy danh sách task:", err);
    res.status(500).json({ error: "Không thể lấy danh sách nhiệm vụ." });
  }
});

// 2. Đặt link mới (Kiểm tra nếu >= 10 điểm mới cho tạo và trừ 10 điểm)
router.post("/", async (req, res) => {
  if (!req.currentUser) return res.status(401).json({ error: "Chưa đăng nhập." });

  const { title, url } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ tiêu đề và link." });
  }

  // Dùng Session Transaction để đảm bảo an toàn điểm số và tạo task
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.currentUser._id).session(session);

    if (!user || user.points < 10) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error: "Bạn cần tối thiểu 10 điểm để đăng 1 link. Hãy tương tác link của người khác để kiếm thêm điểm!"
      });
    }

    // Trừ 10 điểm của user
    user.points -= 10;
    await user.save({ session });

    // Tạo Task mới
    const newTask = new Task({
      user_id: user._id,
      title,
      url
    });
    await newTask.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      taskId: newTask._id,
      message: "Đã trừ 10 điểm và đăng link thành công!"
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Lỗi đăng link:", err);
    res.status(500).json({ error: "Không thể đăng link." });
  }
});

// 3. Tương tác link (Cộng +1 điểm & Lưu vết CrossLog)
router.post("/:id/complete", async (req, res) => {
  if (!req.currentUser) return res.status(401).json({ error: "Chưa đăng nhập." });

  const taskId = req.params.id;
  const userId = req.currentUser._id;

  // Kiểm tra tính hợp lệ của Task ID
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ error: "Mã nhiệm vụ không hợp lệ." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Kiểm tra task có tồn tại không
    const task = await Task.findById(taskId).session(session);
    if (!task) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Nhiệm vụ không tồn tại." });
    }

    // Không cho phép tự làm nhiệm vụ của chính mình
    if (task.user_id.toString() === userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Bạn không thể tự tương tác link của chính mình!" });
    }

    // 2. Kiểm tra số lượt tương tác hiện tại
    const interactionCount = await CrossLog.countDocuments({ task_id: taskId }).session(session);
    if (interactionCount >= 10) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Link này đã đạt tối đa 10 lượt tương tác." });
    }

    // 3. Kiểm tra xem user này đã click link này chưa
    const existingLog = await CrossLog.findOne({ user_id: userId, task_id: taskId }).session(session);
    if (existingLog) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Bạn đã tương tác với link này rồi!" });
    }

    // 4. Tạo Log tương tác & Cộng +1 điểm cho User
    await CrossLog.create([{ user_id: userId, task_id: taskId }], { session });
    await User.findByIdAndUpdate(userId, { $inc: { points: 1 } }, { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: "Tương tác thành công! Bạn nhận được +1 điểm." });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // Bắt lỗi trùng lặp nếu bấm nhanh 2 lần liên tiếp (E11000 duplicate key error)
    if (err.code === 11000) {
      return res.status(400).json({ error: "Bạn đã tương tác với link này rồi!" });
    }

    console.error("Lỗi hoàn thành nhiệm vụ:", err);
    res.status(500).json({ error: "Lỗi xử lý tương tác." });
  }
});

// 4. Báo cáo link vi phạm
router.post("/:id/report", async (req, res) => {
  if (!req.currentUser) return res.status(401).json({ error: "Chưa đăng nhập." });

  const taskId = req.params.id;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ error: "Mã nhiệm vụ không hợp lệ." });
  }

  try {
    await Report.create({
      reporter_id: req.currentUser._id,
      task_id: taskId,
      reason: reason || "Nghi vấn không tương tác thật"
    });

    res.json({ success: true, message: "Đã gửi báo cáo tới Admin xem xét." });
  } catch (err) {
    console.error("Lỗi báo cáo vi phạm:", err);
    res.status(500).json({ error: "Không thể gửi báo cáo." });
  }
});

module.exports = router;
