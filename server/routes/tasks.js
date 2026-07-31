const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { User, Task, CrossLog, Report } = require("../models/Schemas");

// 1. Lấy danh sách nhiệm vụ cho User thường (Ẩn những link đã đủ 10 lượt tương tác)
router.get("/", async (req, res) => {
  try {
    const currentUserId = req.currentUser ? req.currentUser._id : null;

    // Aggregation pipeline kiểm tra số lượt tương tác của từng task
    const tasks = await Task.aggregate([
      {
        $lookup: {
          from: "crosslogs",
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
      { $unwind: "$creator" },
      {
        $project: {
          title: 1,
          url: 1,
          created_at: 1,
          creator_name: "$creator.username",
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
    res.status(500).json({ error: "Không thể lấy danh sách nhiệm vụ." });
  }
});

// 2. Đặt link mới (Kiểm tra nếu >= 10 điểm mới cho tạo và trừ 10 điểm)
router.post("/", async (req, res) => {
  if (!req.currentUser) return res.status(401).json({ error: "Chưa đăng nhập." });

  // Kiểm tra điểm người dùng
  const user = await User.findById(req.currentUser._id);
  if (user.points < 10) {
    return res.status(400).json({
      error: "Bạn cần tối thiểu 10 điểm để đăng 1 link. Hãy tương tác link của người khác để kiếm thêm điểm!"
    });
  }

  const { title, url } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ tiêu đề và link." });
  }

  // Dùng MongoDB Transaction để đảm bảo tính an toàn dữ liệu
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Trừ 10 điểm
    user.points -= 10;
    await user.save({ session });

    // Tạo Task
    const newTask = new Task({
      user_id: user._id,
      title,
      url
    });
    await newTask.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, taskId: newTask._id, message: "Đã trừ 10 điểm và đăng link thành công!" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: "Không thể đăng link." });
  }
});

// 3. Tương tác link (Cộng +1 điểm & Lưu vết CrossLog)
router.post("/:id/complete", async (req, res) => {
  if (!req.currentUser) return res.status(401).json({ error: "Chưa đăng nhập." });

  const taskId = req.params.id;
  const userId = req.currentUser._id;

  try {
    // Kiểm tra số lượt tương tác hiện tại
    const interactionCount = await CrossLog.countDocuments({ task_id: taskId });
    if (interactionCount >= 10) {
      return res.status(400).json({ error: "Link này đã đạt tối đa 10 lượt tương tác." });
    }

    // Kiểm tra xem user này đã click link này chưa
    const existingLog = await CrossLog.findOne({ user_id: userId, task_id: taskId });
    if (existingLog) {
      return res.status(400).json({ error: "Bạn đã tương tác với link này rồi!" });
    }

    // Thực hiện cộng điểm và ghi log
    await CrossLog.create({ user_id: userId, task_id: taskId });
    await User.findByIdAndUpdate(userId, { $inc: { points: 1 } });

    res.json({ success: true, message: "Tương tác thành công! Bạn nhận được +1 điểm." });
  } catch (err) {
    res.status(500).json({ error: "Lỗi xử lý tương tác." });
  }
});

// 4. Báo cáo link vi phạm
router.post("/:id/report", async (req, res) => {
  if (!req.currentUser) return res.status(401).json({ error: "Chưa đăng nhập." });

  const taskId = req.params.id;
  const { reason } = req.body;

  try {
    await Report.create({
      reporter_id: req.currentUser._id,
      task_id: taskId,
      reason: reason || "Nghi vấn không tương tác thật"
    });

    res.json({ success: true, message: "Đã gửi báo cáo tới Admin xem xét." });
  } catch (err) {
    res.status(500).json({ error: "Không thể gửi báo cáo." });
  }
});

module.exports = router;
