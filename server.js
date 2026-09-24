const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('database.sqlite');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function initDatabaseAndData() {
  await run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      student_code TEXT NOT NULL UNIQUE,
      phone TEXT,
      class_name TEXT DEFAULT '27专升本VIP一班'
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS course_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_type TEXT NOT NULL,
      course_name TEXT NOT NULL,
      purchased_hours REAL NOT NULL DEFAULT 0.00,
      consumed_hours REAL NOT NULL DEFAULT 0.00,
      remaining_hours REAL NOT NULL DEFAULT 0.00
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS lesson_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      package_id INTEGER NOT NULL,
      course_type TEXT NOT NULL,
      course_name TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      lesson_date TEXT NOT NULL,
      consumed_hours REAL NOT NULL,
      remaining_hours_snap REAL NOT NULL,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS ding_config (
      id INTEGER PRIMARY KEY,
      webhook_url TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    )
  `);

  const countRow = await get('SELECT COUNT(*) as cnt FROM students');
  if (countRow.cnt === 0) {
    console.log('正在初始化 30 位学员与 42 条课包底账...');
    const students = [
      [1, '李嘉轩', 'XDF-VIP-001', '13800130001', '27专升本VIP一班'],
      [2, '季坤',   'XDF-VIP-002', '13800130002', '27专升本VIP一班'],
      [3, '邹云海', 'XDF-VIP-003', '13800130003', '27专升本VIP一班'],
      [4, '陈瑞瑞', 'XDF-VIP-004', '13800130004', '27专升本VIP一班'],
      [5, '朱琳',   'XDF-VIP-005', '13800130005', '27专升本VIP一班'],
      [6, '许达源', 'XDF-VIP-006', '13800130006', '27专升本VIP一班'],
      [7, '郑权日', 'XDF-VIP-007', '13800130007', '27专升本VIP一班'],
      [8, '巴子彧', 'XDF-VIP-008', '13800130008', '27专升本VIP一班'],
      [9, '张浩然', 'XDF-VIP-009', '13800130009', '27专升本VIP一班'],
      [10, '郭大伟', 'XDF-VIP-010', '13800130010', '27专升本VIP一班'],
      [11, '黄竣',   'XDF-VIP-011', '13800130011', '27专升本VIP一班'],
      [12, '郑瑀童', 'XDF-VIP-012', '13800130012', '27专升本VIP一班'],
      [13, '薛月珍', 'XDF-VIP-013', '13800130013', '27专升本VIP一班'],
      [14, '齐紫妤', 'XDF-VIP-014', '13800130014', '27专升本VIP一班'],
      [15, '张晨旭', 'XDF-VIP-015', '13800130015', '27专升本VIP一班'],
      [16, '张硕桐', 'XDF-VIP-016', '13800130016', '27专升本VIP一班'],
      [17, '许艺允', 'XDF-VIP-017', '13800130017', '27专升本VIP一班'],
      [18, '陈铄橦', 'XDF-VIP-018', '13800130018', '27专升本VIP一班'],
      [19, '李喆',   'XDF-VIP-019', '13800130019', '27专升本VIP一班'],
      [20, '陈佳乐', 'XDF-VIP-020', '13800130020', '27专升本VIP一班'],
      [21, '刘祖旭', 'XDF-VIP-021', '13800130021', '27专升本VIP一班'],
      [22, '高邦杰', 'XDF-VIP-022', '13800130022', '26专升本VIP班'],
      [23, '吴程宇', 'XDF-VIP-023', '13800130023', '27专升本VIP一班'],
      [24, '娄嘉元', 'XDF-VIP-024', '13800130024', '26专升本VIP班'],
      [25, '叶芮杉', 'XDF-VIP-025', '13800130025', '26专升本VIP班'],
      [26, '何钰恒', 'XDF-VIP-026', '13800130026', '26专升本VIP班'],
      [27, '顾健',   'XDF-VIP-027', '13800130027', '26专升本VIP班'],
      [28, '刘烨林', 'XDF-VIP-028', '13800130028', '26专升本VIP班'],
      [29, '宋文普', 'XDF-VIP-029', '13800130029', '26专升本VIP班'],
      [30, '戴绍宸', 'XDF-VIP-030', '13800130030', '26专升本VIP班']
    ];
    for (const s of students) {
      await run('INSERT INTO students (id, student_name, student_code, phone, class_name) VALUES (?,?,?,?,?)', s);
    }

    const pkgs = [
      [1, '专升本专业课一对一', '27专升本专业课VIP', 40.0, 0.0, 40.0],
      [2, '专升本专业课一对一', '27专升本专业课VIP', 8.0, 0.0, 8.0],
      [3, '专升本专业课一对一', '27专升本专业课VIP', 15.0, 0.0, 15.0],
      [4, '专升本专业课一对一', '27专升本专业课VIP', 20.0, 0.0, 20.0],
      [5, '专升本公共课一对一', '27专升本公共课VIP', 50.0, 14.0, 36.0],
      [6, '专升本公共课一对一', '27专升本公共课VIP', 20.0, 5.0, 15.0],
      [7, '专升本公共课一对一', '27专升本公共课VIP', 20.0, 12.0, 8.0],
      [8, '专升本公共课一对一', '27专升本公共课VIP', 14.0, 0.0, 14.0],
      [7, '专升本公共课一对一', '27专升本公共课VIP', 4.0, 4.0, 0.0],
      [5, '专升本专业课一对一', '27专升本专业课VIP', 50.0, 0.0, 50.0],
      [9, '专升本公共课一对一', '27专升本公共课VIP', 50.0, 2.0, 48.0],
      [3, '专升本专业课一对一', '27专升本专业课VIP', 40.0, 38.0, 2.0],
      [3, '专升本公共课一对一', '27专升本公共课VIP', 145.0, 36.0, 109.0],
      [10, '专升本公共课一对一', '27专升本公共课VIP', 10.0, 8.0, 2.0],
      [11, '专升本公共课一对一', '27专升本公共课VIP', 13.0, 0.0, 13.0],
      [12, '专升本公共课一对一', '27专升本公共课VIP', 20.0, 10.0, 10.0],
      [13, '专升本专业课一对一', '27专升本专业课VIP', 12.0, 0.0, 12.0],
      [14, '专升本公共课一对一', '27专升本公共课VIP', 9.0, 0.0, 9.0],
      [15, '专升本专业课一对一', '27专升本专业课VIP', 34.0, 2.0, 32.0],
      [16, '专升本公共课一对一', '27专升本公共课VIP', 4.0, 0.0, 4.0],
      [17, '专升本专业课一对一', '27专升本专业课VIP', 20.0, 0.0, 20.0],
      [18, '专升本公共课一对一', '27专升本公共课VIP', 100.0, 8.0, 92.0],
      [19, '专升本专业课一对一', '27专升本专业课VIP', 9.0, 1.0, 8.0],
      [20, '专升本专业课一对一', '27专升本专业课VIP', 6.0, 4.0, 2.0],
      [21, '专升本专业课一对一', '27专升本专业课VIP', 40.0, 32.0, 8.0],
      [1, '专升本公共课一对一', '27专升本公共课VIP', 100.0, 66.0, 34.0],
      [22, '专升本公共课一对一', '27专升本公共课VIP', 4.0, 4.0, 0.0],
      [22, '专升本公共课一对一', '26专升本公共课VIP', 36.0, 34.0, 2.0],
      [23, '专升本专业课一对一', '27专升本专业课VIP', 40.0, 2.0, 38.0],
      [23, '专升本公共课一对一', '27专升本公共课VIP', 200.0, 58.0, 142.0],
      [24, '专升本公共课一对一', '26专升本公共课VIP', 4.0, 4.0, 0.0],
      [25, '专升本公共课一对一', '26专升本公共课VIP', 12.0, 12.0, 0.0],
      [26, '专升本公共课一对一', '26专升本公共课VIP', 86.0, 68.0, 18.0],
      [25, '专升本公共课一对一', '26专升本公共课VIP', 10.0, 10.0, 0.0],
      [27, '专升本专业课一对一', '26专升本专业课VIP', 24.0, 24.0, 0.0],
      [28, '专升本公共课一对一', '26专升本公共课VIP', 0.0, 0.0, 0.0],
      [25, '专升本公共课一对一', '26专升本公共课VIP', 22.0, 22.0, 0.0],
      [29, '专升本公共课一对一', '26专升本公共课VIP', 34.0, 34.0, 0.0],
      [27, '专升本公共课一对一', '26专升本公共课VIP', 28.0, 28.0, 0.0],
      [22, '专升本公共课一对一', '26专升本公共课VIP', 60.0, 60.0, 0.0],
      [30, '专升本公共课一对一', '26专升本公共课VIP', 8.0, 8.0, 0.0],
      [30, '专升本公共课一对一', '25专升本公共课', 23.0, 23.0, 0.0]
    ];
    for (const p of pkgs) {
      await run('INSERT INTO course_packages (student_id, course_type, course_name, purchased_hours, consumed_hours, remaining_hours) VALUES (?,?,?,?,?,?)', p);
    }
  }
}

async function pushDingMarkdown(title, text) {
  const cfg = await get('SELECT webhook_url FROM ding_config WHERE id = 1 AND is_active = 1');
  if (!cfg || !cfg.webhook_url || !cfg.webhook_url.startsWith('http')) {
    throw new Error('未配置有效的钉钉机器人 Webhook 地址，请在【⚙️ 钉钉配置】中填写');
  }
  await axios.post(cfg.webhook_url, {
    msgtype: 'markdown',
    markdown: { title, text }
  });
}

// 1. 学员列表
app.get('/api/students', async (req, res) => {
  const rows = await all('SELECT * FROM students ORDER BY id DESC');
  res.json({ success: true, data: rows });
});

// 【新增功能】彻底剔除学员接口（级联删除学生基本信息、关联课包和历史消课记录）
app.post('/api/students/delete', async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: '学员ID不能为空！' });

    const stu = await get('SELECT student_name FROM students WHERE id = ?', [studentId]);
    if (!stu) return res.status(404).json({ message: '未找到该学员！' });

    await run('DELETE FROM lesson_records WHERE student_id = ?', [studentId]);
    await run('DELETE FROM course_packages WHERE student_id = ?', [studentId]);
    await run('DELETE FROM students WHERE id = ?', [studentId]);

    res.json({ success: true, message: '学员【' + stu.student_name + '】及其课包与消课流水已彻底剔除！' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. 学员特定流水（用于在消课登记处就地撤回）
app.get('/api/students/:id/records', async (req, res) => {
  const rows = await all(`
    SELECT r.*, p.course_name 
    FROM lesson_records r 
    JOIN course_packages p ON r.package_id = p.id
    WHERE r.student_id = ? 
    ORDER BY r.id DESC LIMIT 20
  `, [req.params.id]);
  res.json({ success: true, data: rows });
});

// 3. 新增学员及初始课包
app.post('/api/students/add', async (req, res) => {
  try {
    const { studentName, studentCode, phone, className, courseType, courseName, purchasedHours, consumedHours } = req.body;
    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ message: '学员姓名不能为空！' });
    }
    const code = (studentCode && studentCode.trim()) || ('XDF-' + Date.now().toString().slice(-4));
    const pur = parseFloat(purchasedHours) || 0;
    const con = parseFloat(consumedHours) || 0;
    if (pur < con) return res.status(400).json({ message: '购买课时不能小于已消课时！' });
    const rem = pur - con;

    const stuRes = await run(
      'INSERT INTO students (student_name, student_code, phone, class_name) VALUES (?,?,?,?)',
      [studentName.trim(), code, phone || '', className || '27专升本VIP班']
    );

    if (courseType && pur > 0) {
      await run(
        'INSERT INTO course_packages (student_id, course_type, course_name, purchased_hours, consumed_hours, remaining_hours) VALUES (?,?,?,?,?,?)',
        [stuRes.lastID, courseType, courseName || courseType, pur, con, rem]
      );
    }
    res.json({ success: true, message: '学员及课包新增成功！' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. 追加课包
app.post('/api/packages/add', async (req, res) => {
  try {
    const { studentId, courseType, courseName, purchasedHours, consumedHours } = req.body;
    if (!studentId || !courseType) return res.status(400).json({ message: '请选择学员并输入课程类型！' });
    const pur = parseFloat(purchasedHours) || 0;
    const con = parseFloat(consumedHours) || 0;
    if (pur < con) return res.status(400).json({ message: '购买课时不能小于已消课时！' });
    const rem = pur - con;

    await run(
      'INSERT INTO course_packages (student_id, course_type, course_name, purchased_hours, consumed_hours, remaining_hours) VALUES (?,?,?,?,?,?)',
      [studentId, courseType, courseName || courseType, pur, con, rem]
    );
    res.json({ success: true, message: '课包添加成功！' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/students/:id/packages', async (req, res) => {
  const rows = await all('SELECT * FROM course_packages WHERE student_id = ? ORDER BY id ASC', [req.params.id]);
  res.json({ success: true, data: rows });
});

// 5. 大盘看板（含日消课、周消课进度指标）
app.get('/api/board/progress', async (req, res) => {
  try {
    const sortBy = req.query.sort || 'remaining';
    let orderSql = 'remaining_hours DESC';
    if (sortBy === 'consumed') orderSql = 'consumed_hours DESC';
    if (sortBy === 'purchased') orderSql = 'purchased_hours DESC';

    const rows = await all(`
      SELECT 
        s.id AS student_id,
        s.student_name,
        s.student_code,
        s.class_name,
        p.id AS package_id,
        p.course_type,
        p.course_name,
        p.purchased_hours,
        p.consumed_hours,
        p.remaining_hours,
        ROUND((p.consumed_hours * 100.0 / NULLIF(p.purchased_hours, 0)), 1) AS progress_rate
      FROM course_packages p
      JOIN students s ON p.student_id = s.id
      ORDER BY p.${orderSql}, s.id ASC
    `);

    const summary = await get(`
      SELECT 
        COUNT(DISTINCT s.id) AS total_students,
        COUNT(p.id) AS total_packages,
        COALESCE(SUM(p.purchased_hours), 0) AS total_purchased,
        COALESCE(SUM(p.consumed_hours), 0) AS total_consumed,
        COALESCE(SUM(p.remaining_hours), 0) AS total_remaining
      FROM course_packages p
      JOIN students s ON p.student_id = s.id
    `);

    const todayStat = await get(`
      SELECT COALESCE(SUM(consumed_hours), 0) AS today_consumed, COUNT(id) AS today_lessons
      FROM lesson_records
      WHERE date(lesson_date) = date('now', 'localtime')
    `);

    const weekStat = await get(`
      SELECT COALESCE(SUM(consumed_hours), 0) AS week_consumed, COUNT(id) AS week_lessons
      FROM lesson_records
      WHERE strftime('%Y-%W', lesson_date) = strftime('%Y-%W', 'now', 'localtime')
    `);

    const dayTarget = 10.0;
    const weekTarget = 60.0;
    const dayProgressRate = Math.min(100, Math.round((todayStat.today_consumed / dayTarget) * 100));
    const weekProgressRate = Math.min(100, Math.round((weekStat.week_consumed / weekTarget) * 100));

    res.json({
      success: true,
      data: rows,
      summary: {
        ...summary,
        today_consumed: todayStat.today_consumed,
        today_lessons: todayStat.today_lessons,
        day_progress_rate: dayProgressRate,
        day_target: dayTarget,
        week_consumed: weekStat.week_consumed,
        week_lessons: weekStat.week_lessons,
        week_progress_rate: weekProgressRate,
        week_target: weekTarget
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. 课消打卡
app.post('/api/records/checkin', async (req, res) => {
  try {
    const { studentId, packageId, teacherName, lessonDate, consumedHours, remarks } = req.body;
    const hours = parseFloat(consumedHours);
    const tName = (teacherName || '').trim();

    if (!studentId || !packageId || !tName || !lessonDate || !hours || hours <= 0) {
      return res.status(400).json({ message: '请完整填写真实消课信息，授课老师姓名不能为空！' });
    }

    const pkg = await get('SELECT * FROM course_packages WHERE id = ?', [packageId]);
    if (!pkg) return res.status(404).json({ message: '未找到对应课程包' });

    if (parseFloat(pkg.remaining_hours) < hours) {
      return res.status(400).json({ message: '该课包剩余课时不足！当前剩余仅 ' + pkg.remaining_hours + ' 小时' });
    }

    const newRemain = parseFloat(pkg.remaining_hours) - hours;
    const newConsumed = parseFloat(pkg.consumed_hours) + hours;

    await run('UPDATE course_packages SET remaining_hours = ?, consumed_hours = ? WHERE id = ?', [newRemain, newConsumed, pkg.id]);
    await run(
      'INSERT INTO lesson_records (student_id, package_id, course_type, course_name, teacher_name, lesson_date, consumed_hours, remaining_hours_snap, remarks) VALUES (?,?,?,?,?,?,?,?,?)',
      [studentId, pkg.id, pkg.course_type, pkg.course_name, tName, lessonDate, hours, newRemain, remarks || '']
    );

    const stu = await get('SELECT student_name FROM students WHERE id = ?', [studentId]);

    pushDingMarkdown('【一对一课消提醒】', 
      '### 📢【新东方一对一课消打卡】\n\n' +
      '> **学生：** ' + stu.student_name + '\n\n' +
      '> **课程包：** ' + pkg.course_name + ' (' + pkg.course_type + ')\n\n' +
      '> **授课老师：** ' + tName + '\n\n' +
      '> **课消日期：** ' + lessonDate + '\n\n' +
      '> **本次消耗：** <font color="#1E6CEB">' + hours + ' 小时</font>\n\n' +
      '> **当前剩余：** <font color="' + (newRemain <= 5 ? '#FF4D4F' : '#52C41A') + '">' + newRemain + ' 小时</font>\n\n' +
      '> **状态：** ✅ 打卡成功'
    ).catch(() => {});

    res.json({ success: true, remainingHours: newRemain });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. 撤销消课
app.post('/api/records/revoke', async (req, res) => {
  try {
    const { recordId } = req.body;
    const r = await get('SELECT * FROM lesson_records WHERE id = ?', [recordId]);
    if (!r) return res.status(404).json({ message: '未找到该条消课记录' });

    await run('UPDATE course_packages SET remaining_hours = remaining_hours + ?, consumed_hours = consumed_hours - ? WHERE id = ?', [r.consumed_hours, r.consumed_hours, r.package_id]);
    await run('DELETE FROM lesson_records WHERE id = ?', [recordId]);

    res.json({ success: true, message: '撤销成功！已自动向学员课包返还 ' + r.consumed_hours + ' 课时' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. 钉钉推送
app.post('/api/ding/sync-summary', async (req, res) => {
  try {
    const summary = await get(`
      SELECT 
        COUNT(DISTINCT s.id) AS total_students,
        COALESCE(SUM(p.purchased_hours), 0) AS total_purchased,
        COALESCE(SUM(p.consumed_hours), 0) AS total_consumed,
        COALESCE(SUM(p.remaining_hours), 0) AS total_remaining
      FROM course_packages p
      JOIN students s ON p.student_id = s.id
    `);

    const todayStat = await get(`
      SELECT COALESCE(SUM(consumed_hours), 0) AS today_consumed, COUNT(id) AS today_lessons
      FROM lesson_records
      WHERE date(lesson_date) = date('now', 'localtime')
    `);

    const weekStat = await get(`
      SELECT COALESCE(SUM(consumed_hours), 0) AS week_consumed, COUNT(id) AS week_lessons
      FROM lesson_records
      WHERE strftime('%Y-%W', lesson_date) = strftime('%Y-%W', 'now', 'localtime')
    `);

    const warnCount = await get(`
      SELECT COUNT(*) as cnt FROM course_packages WHERE remaining_hours <= 5.00
    `);

    const text = 
      '### 📊【新东方一对一课消实时大盘日报】\n\n' +
      '---\n\n' +
      '> **学员总数：** ' + summary.total_students + ' 人\n\n' +
      '> **总购买课时：** ' + summary.total_purchased + ' h\n\n' +
      '> **未消课时总额：** <font color="#FA8C16">' + summary.total_remaining + ' h</font>\n\n' +
      '> **🌟 今日消课进度：** <font color="#1E6CEB">**' + todayStat.today_consumed + ' h**</font> (' + todayStat.today_lessons + ' 单)\n\n' +
      '> **📅 本周消课进度：** <font color="#389E0D">**' + weekStat.week_consumed + ' h**</font> (' + weekStat.week_lessons + ' 单)\n\n' +
      '> **⚠️ 课时不足预警：** <font color="#CF1322">**' + warnCount.cnt + ' 个课包 (<=5h)**</font>\n\n' +
      '> **同步时间：** ' + new Date().toLocaleString('zh-CN', { hour12: false }) + '\n\n' +
      '> *数据源自新东方专升本项目中心系统*';

    await pushDingMarkdown('【新东方一对一课消日报】', text);
    res.json({ success: true, message: '🎉 钉钉大盘日报推送成功！' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/ding/sync-warnings', async (req, res) => {
  try {
    const list = await all(`
      SELECT p.*, s.student_name, s.student_code FROM course_packages p
      JOIN students s ON p.student_id = s.id WHERE p.remaining_hours <= 5.00 ORDER BY p.remaining_hours ASC
    `);

    if (!list.length) return res.json({ success: true, message: '目前没有剩余低于5小时的学员，无需推送！' });

    let itemLines = '';
    list.forEach(w => {
      itemLines += '> • **' + w.student_name + '** | ' + w.course_type + ' | 仅剩 <font color="#CF1322">**' + w.remaining_hours + 'h**</font>\n\n';
    });

    const text = 
      '### ⚠️【新东方 VIP 一对一课时不足告警名单】\n\n' +
      '以下学员课程包剩余课时已不足 5 小时，请学管老师尽快安排续费沟通：\n\n' +
      itemLines +
      '> **统计总数：** 共 ' + list.length + ' 个课包\n\n' +
      '> **发送时间：** ' + new Date().toLocaleString('zh-CN', { hour12: false });

    await pushDingMarkdown('【课时不足预警提醒】', text);
    res.json({ success: true, message: '⚠️ 已成功推送 ' + list.length + ' 条低课时预警至钉钉群！' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/stats/teachers', async (req, res) => {
  const rows = await all(`
    SELECT teacher_name, COALESCE(SUM(consumed_hours), 0) AS total_hours, COUNT(id) AS total_lessons, COUNT(DISTINCT student_id) AS student_count
    FROM lesson_records GROUP BY teacher_name ORDER BY total_hours DESC
  `);
  res.json({ success: true, data: rows });
});

app.get('/api/records', async (req, res) => {
  const rows = await all(`
    SELECT r.*, s.student_name, s.student_code FROM lesson_records r
    JOIN students s ON r.student_id = s.id ORDER BY r.id DESC LIMIT 100
  `);
  res.json({ success: true, data: rows });
});

app.get('/api/stats/warnings', async (req, res) => {
  const rows = await all(`
    SELECT p.*, s.student_name, s.student_code FROM course_packages p
    JOIN students s ON p.student_id = s.id WHERE p.remaining_hours <= 5.00 ORDER BY p.remaining_hours ASC
  `);
  res.json({ success: true, data: rows });
});

app.get('/api/ding-config', async (req, res) => {
  const cfg = await get('SELECT webhook_url FROM ding_config WHERE id = 1');
  res.json({ success: true, data: cfg || {} });
});
app.post('/api/ding-config', async (req, res) => {
  await run('INSERT OR REPLACE INTO ding_config (id, webhook_url, is_active) VALUES (1, ?, 1)', [req.body.webhook_url]);
  res.json({ success: true, message: '钉钉 Webhook 保存成功！' });
});

app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>新东方专升本项目中心 - 一对一课消管理与未消课时降序看板</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F4F6F9; margin: 0; padding: 12px; color: #333; }
      .container { max-width: 960px; margin: auto; }
      .tabs { display: flex; background: #E9ECEF; border-radius: 10px; padding: 4px; margin-bottom: 14px; overflow-x: auto; }
      .tab { flex: 1; min-width: 95px; text-align: center; padding: 9px 4px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; color: #555; white-space: nowrap; }
      .tab.active { background: #1E6CEB; color: #fff; }
      .card { background: #fff; border-radius: 12px; padding: 18px; box-shadow: 0 3px 10px rgba(0,0,0,0.05); margin-bottom: 15px; }
      .header { text-align: center; margin-bottom: 16px; }
      .logo { background: #1E6CEB; color: #fff; padding: 3px 10px; border-radius: 6px; font-weight: 800; font-size: 15px; display: inline-block; }
      h2 { color: #1E6CEB; font-size: 19px; margin: 6px 0 2px 0; }
      .form-group { margin-bottom: 13px; }
      label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 5px; }
      select, input { width: 100%; height: 42px; border: 1px solid #DCDFE6; border-radius: 8px; padding: 0 12px; font-size: 14px; outline: none; }
      select:focus, input:focus { border-color: #1E6CEB; }
      .remain-card { background: #F0F5FF; border: 1px solid #D6E4FF; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; font-size: 13px; line-height: 1.6; }
      .badge-warn { color: #cf1322; background: #fff1f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
      .badge-ok { color: #389e0d; background: #f6ffed; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
      .btn { width: 100%; height: 46px; background: #1E6CEB; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 6px; }
      .btn:hover { background: #185ac4; }
      .table-box { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
      .table-box th, .table-box td { border: 1px solid #E8E8E8; padding: 8px; text-align: left; }
      .table-box th { background: #FAFAFA; font-weight: 600; }
      .revoke-btn { color: #ff4d4f; cursor: pointer; text-decoration: underline; font-weight: 600; }
      .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 15px; }
      .stat-card { background: #F8F9FA; border: 1px solid #E9ECEF; border-radius: 8px; padding: 10px 8px; text-align: center; position: relative; }
      .stat-card .tit { font-size: 12px; color: #666; font-weight: 600; }
      .stat-card .val { font-size: 18px; font-weight: bold; color: #1E6CEB; margin-top: 4px; }
      .stat-progress-box { margin-top: 6px; }
      .progress-bar-bg { background: #E9ECEF; border-radius: 8px; height: 9px; width: 100%; overflow: hidden; }
      .progress-bar-fill { background: #1E6CEB; height: 100%; border-radius: 8px; }
      .filter-bar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
      .filter-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid #DCDFE6; background: #FFF; cursor: pointer; font-size: 12px; font-weight: 600; }
      .filter-btn.active { background: #1E6CEB; color: #FFF; border-color: #1E6CEB; }
      .ding-action-bar { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
      .ding-sync-btn { flex: 1; min-width: 140px; height: 38px; border: none; border-radius: 8px; color: #FFF; font-weight: 600; font-size: 13px; cursor: pointer; }
      .stu-history-card { margin-top: 14px; border-top: 1px dashed #DCDFE6; padding-top: 12px; }
      .del-btn { color: #ff4d4f; cursor: pointer; font-weight: 600; text-decoration: underline; }
      .del-btn:hover { color: #cf1322; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="tabs">
        <div class="tab active" id="tab0" onclick="switchTab(0)">📊 进度看板</div>
        <div class="tab" id="tab1" onclick="switchTab(1)">📝 课消登记/就地撤回</div>
        <div class="tab" id="tab2" onclick="switchTab(2)">➕ 学员管理/剔除</div>
        <div class="tab" id="tab3" onclick="switchTab(3)">👨‍🏫 教师统计</div>
        <div class="tab" id="tab4" onclick="switchTab(4)">📋 消课明细</div>
        <div class="tab" id="tab5" onclick="switchTab(5)">⚠️ 课时预警</div>
        <div class="tab" id="tab6" onclick="switchTab(6)">⚙️ 钉钉配置</div>
      </div>

      <!-- 面板 0：全局进度看板 -->
      <div id="panel0" class="card">
        <div class="header">
          <span class="logo">XDF</span>
          <h2>📊 全局名单与消耗进度看板</h2>
          <small style="color:#666;">按<b>未消课课时降序排列</b>（期初底账不计入今日/本周打卡流水）</small>
        </div>

        <div class="ding-action-bar">
          <button class="ding-sync-btn" style="background:#1E6CEB;" onclick="triggerDingSummary()">🚀 一键同步大盘日报至钉钉群</button>
          <button class="ding-sync-btn" style="background:#FF4D4F;" onclick="triggerDingWarnings()">⚠️ 一键推送低课时告警名单</button>
        </div>

        <div class="stat-grid" id="summaryGrid">
          <div class="stat-card">
            <div class="tit">学员总数</div>
            <div class="val" id="sumStu">-</div>
          </div>
          <div class="stat-card">
            <div class="tit">总购买课时</div>
            <div class="val" id="sumPurchased">-</div>
          </div>
          <div class="stat-card">
            <div class="tit">未消课时 (剩余)</div>
            <div class="val" style="color:#FA8C16;" id="sumRemaining">-</div>
          </div>
          
          <!-- 日消课进度卡片 -->
          <div class="stat-card" style="background:#E6F7FF;border-color:#91D5FF;">
            <div class="tit" style="color:#0050B3;">🌟 今日消课进度</div>
            <div class="val" style="color:#096DD9;" id="sumToday">0 h</div>
            <div class="stat-progress-box">
              <div class="progress-bar-bg"><div class="progress-bar-fill" id="dayProgressBar" style="width:0%;background:#096DD9;"></div></div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:#555;margin-top:3px;">
                <span id="dayRateTxt">0%</span>
                <span id="dayTargetTxt">目标 10h</span>
              </div>
            </div>
          </div>

          <!-- 周消课进度卡片 -->
          <div class="stat-card" style="background:#F6FFED;border-color:#B7EB8F;">
            <div class="tit" style="color:#237804;">📅 本周消课进度</div>
            <div class="val" style="color:#389E0D;" id="sumWeek">0 h</div>
            <div class="stat-progress-box">
              <div class="progress-bar-bg"><div class="progress-bar-fill" id="weekProgressBar" style="width:0%;background:#52C41A;"></div></div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:#555;margin-top:3px;">
                <span id="weekRateTxt">0%</span>
                <span id="weekTargetTxt">目标 60h</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="tit">整体消耗率</div>
            <div class="val" id="sumRate">-%</div>
          </div>
        </div>

        <div class="filter-bar">
          <button class="filter-btn active" id="btnSortRemain" onclick="loadBoard('remaining')">⬇️ 未消课时降序 (默认)</button>
          <button class="filter-btn" id="btnSortConsumed" onclick="loadBoard('consumed')">⬇️ 累计已消降序</button>
          <button class="filter-btn" id="btnSortPurchased" onclick="loadBoard('purchased')">⬇️ 总购买课时降序</button>
          <input id="boardSearch" placeholder="输入姓名快速筛选..." oninput="filterBoardRows()" style="flex:1;min-width:140px;height:32px;font-size:12px;">
          <button class="filter-btn" onclick="exportBoardCSV()" style="background:#52C41A;color:#fff;border-color:#52C41A;">📥 导出报表</button>
        </div>

        <div style="overflow-x:auto;">
          <table class="table-box">
            <thead>
              <tr>
                <th>学员姓名</th>
                <th>课程类型</th>
                <th>总课时</th>
                <th>累计已消</th>
                <th style="color:#FA8C16;">未消课时 (降序)</th>
                <th style="min-width:120px;">消耗进度</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="boardTableBody"></tbody>
          </table>
        </div>
      </div>

      <!-- 面板 1：课消打卡登记 + 学员就地撤回功能 -->
      <div id="panel1" class="card" style="display:none;">
        <div class="header">
          <span class="logo">XDF</span>
          <h2>一对一课消登记 & 学员专属撤回</h2>
          <div style="font-size:12px;color:#888;">精准扣减课包，可就地查看该学员流水并一键撤回退还</div>
        </div>
        <div class="form-group">
          <label>选择学员 (输入姓名实时筛选)</label>
          <input id="searchKeyword" placeholder="输入姓名如: 李嘉轩 / 邹云海 / 朱琳..." oninput="filterStudents()" style="margin-bottom:6px;">
          <select id="studentSelect" onchange="onSelectStudent()">
            <option value="">-- 点击选择学员 --</option>
          </select>
        </div>
        <div class="form-group">
          <label>选择课包 (含课程类型、总/耗/未消课时)</label>
          <select id="packageSelect" onchange="onSelectPackage()">
            <option value="">-- 请先选择学员 --</option>
          </select>
        </div>
        <div id="packageDetail" class="remain-card" style="display:none;">
          <div><b>课程类型：</b><span id="pkgType">-</span></div>
          <div><b>总课时：</b><span id="pkgTotal">-</span> | <b>累计已消：</b><span id="pkgConsumed">-</span></div>
          <div style="margin-top:4px;"><b>当前未消课时：</b><span id="pkgRemain" class="badge-ok">-</span></div>
        </div>
        <div class="form-group">
          <label>授课老师姓名 (老师手动打字输入)</label>
          <input id="teacherName" placeholder="例如：王建国 / 李秀梅">
        </div>
        <div class="form-group">
          <label>课消日期</label>
          <input type="date" id="lessonDate">
        </div>
        <div class="form-group">
          <label>本次消耗课时 (小时)</label>
          <input type="number" id="consumedHours" step="0.5" value="2">
        </div>
        <div class="form-group">
          <label>备注 (选填)</label>
          <input id="lessonRemarks" placeholder="如：专业课核心考点强化">
        </div>
        <button class="btn" onclick="submitLesson()">确认提交课消</button>

        <!-- 学员就地撤回专用区域 -->
        <div class="stu-history-card" id="stuHistoryBox" style="display:none;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <b style="color:#1E6CEB;font-size:14px;">⏪ 当前学员消课记录（支持就地撤回）</b>
            <span style="font-size:12px;color:#888;">撤回后课时立即返还到学员课包</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="table-box" style="margin-top:4px;">
              <thead>
                <tr><th>日期</th><th>课包</th><th>老师</th><th>消课</th><th>剩余</th><th>快捷操作</th></tr>
              </thead>
              <tbody id="stuRecordList"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 面板 2：添加学员 / 课包 & 剔除学员 -->
      <div id="panel2" class="card" style="display:none;">
        <div class="header">
          <h2>➕ 学员与课包管理 / 剔除已存在学员</h2>
          <small style="color:#888;">管理在籍学员、扩充新课包，或彻底清退结课/退费学员</small>
        </div>

        <!-- 专门的学员剔除管理区 -->
        <div style="background:#FFF1F0;border:1px solid #FFA39E;border-radius:8px;padding:14px;margin-bottom:18px;">
          <h3 style="margin-top:0;font-size:15px;color:#CF1322;">🗑️ 剔除已有学员（结课/退课清退）</h3>
          <p style="font-size:12px;color:#666;margin:4px 0 10px 0;">此操作将永久清理该学员档案及其所有课包余额、历史消课明细流水：</p>
          <div class="form-group">
            <label>选择需要剔除的学员</label>
            <select id="deleteStudentSelect">
              <option value="">-- 请选择要剔除的学员 --</option>
            </select>
          </div>
          <button class="btn" style="background:#FF4D4F;" onclick="deleteStudentFromSelect()">⚠️ 确认彻底剔除该学员</button>
        </div>

        <div style="background:#F9FBFD;border:1px solid #E1E8F5;border-radius:8px;padding:14px;margin-bottom:18px;">
          <h3 style="margin-top:0;font-size:15px;color:#1E6CEB;">1. 新建学员（及首个课包）</h3>
          <div class="form-group">
            <label>学员姓名 *</label>
            <input id="newStuName" placeholder="如：赵小龙">
          </div>
          <div class="form-group">
            <label>学号 / 唯一编码 (选填，留空自动生成)</label>
            <input id="newStuCode" placeholder="如：XDF-VIP-031">
          </div>
          <div class="form-group">
            <label>联系电话 (选填)</label>
            <input id="newStuPhone" placeholder="如：13900000000">
          </div>
          <div class="form-group">
            <label>班级属性</label>
            <input id="newStuClass" value="27专升本VIP一班">
          </div>
          <div class="form-group">
            <label>课程类型 (如需配发课包)</label>
            <select id="newPkgType">
              <option value="专升本专业课一对一">专升本专业课一对一</option>
              <option value="专升本公共课一对一">专升本公共课一对一</option>
            </select>
          </div>
          <div class="form-group">
            <label>总购买课时</label>
            <input type="number" id="newPkgPur" value="20">
          </div>
          <div class="form-group">
            <label>期初已消课时 (若为新购填 0)</label>
            <input type="number" id="newPkgCon" value="0">
          </div>
          <button class="btn" onclick="addNewStudent()">确认新增学员及课包</button>
        </div>

        <div style="background:#F9FBFD;border:1px solid #E1E8F5;border-radius:8px;padding:14px;">
          <h3 style="margin-top:0;font-size:15px;color:#1E6CEB;">2. 为已有学员添加新课包</h3>
          <div class="form-group">
            <label>选择学员</label>
            <select id="existStuSelect">
              <option value="">-- 选择已有学员 --</option>
            </select>
          </div>
          <div class="form-group">
            <label>增补课程类型</label>
            <select id="existPkgType">
              <option value="专升本公共课一对一">专升本公共课一对一</option>
              <option value="专升本专业课一对一">专升本专业课一对一</option>
            </select>
          </div>
          <div class="form-group">
            <label>购买课时</label>
            <input type="number" id="existPkgPur" value="30">
          </div>
          <button class="btn" style="background:#52C41A;" onclick="addPackageForExisting()">确认追加课包</button>
        </div>
      </div>

      <!-- 面板 3：教师统计 -->
      <div id="panel3" class="card" style="display:none;">
        <div class="header">
          <h2>👨‍🏫 教师授课课时汇总统计</h2>
          <small style="color:#888;">汇总系统实际产生的一对一课消打卡，不包含期初底账</small>
        </div>
        <div style="overflow-x:auto;">
          <table class="table-box">
            <thead>
              <tr><th>老师姓名</th><th>实际消课课时</th><th>上课单数</th><th>授课学员数</th></tr>
            </thead>
            <tbody id="teacherStatTable"></tbody>
          </table>
        </div>
      </div>

      <!-- 面板 4：消课流水 -->
      <div id="panel4" class="card" style="display:none;">
        <div class="header">
          <h2>📋 课消流水明细（全局）</h2>
          <small style="color:#888;">记录上线后全部打卡流水，支持一键撤销并退还课时</small>
        </div>
        <div style="overflow-x:auto;">
          <table class="table-box">
            <thead>
              <tr><th>日期</th><th>学员</th><th>课程类型</th><th>老师</th><th>消耗</th><th>剩余</th><th>操作</th></tr>
            </thead>
            <tbody id="recordTable"></tbody>
          </table>
        </div>
      </div>

      <!-- 面板 5：课时预警 -->
      <div id="panel5" class="card" style="display:none;">
        <div class="header">
          <h2 style="color:#cf1322;">⚠️ 课时不足预警 (<= 5小时)</h2>
        </div>
        <div style="overflow-x:auto;">
          <table class="table-box">
            <thead>
              <tr><th>学员</th><th>课程类型</th><th>课程包</th><th>未消课时</th></tr>
            </thead>
            <tbody id="warningTable"></tbody>
          </table>
        </div>
      </div>

      <!-- 面板 6：钉钉配置 -->
      <div id="panel6" class="card" style="display:none;">
        <div class="header">
          <h2>⚙️ 钉钉群消课通知配置</h2>
        </div>
        <div class="form-group">
          <label>钉钉机器人 Webhook 地址</label>
          <input id="dingWebhook" placeholder="https://oapi.dingtalk.com/robot/send?access_token=...">
        </div>
        <button class="btn" onclick="saveDingConfig()">保存 Webhook</button>
      </div>
    </div>

    <script>
      let allStudents = [];
      let currentPackages = [];
      let boardData = [];
      let currentSort = 'remaining';
      document.getElementById('lessonDate').value = new Date().toISOString().slice(0,10);

      function switchTab(idx) {
        for (let i = 0; i <= 6; i++) {
          document.getElementById('tab' + i).className = (idx === i) ? 'tab active' : 'tab';
          document.getElementById('panel' + i).style.display = (idx === i) ? 'block' : 'none';
        }
        if (idx === 0) loadBoard(currentSort);
        if (idx === 1) loadData();
        if (idx === 2) loadExistingStudents();
        if (idx === 3) loadTeacherStats();
        if (idx === 4) loadRecords();
        if (idx === 5) loadWarnings();
        if (idx === 6) loadDingConfig();
      }

      loadBoard('remaining');

      async function loadBoard(sort) {
        currentSort = sort;
        ['btnSortRemain', 'btnSortConsumed', 'btnSortPurchased'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.remove('active');
        });
        if (sort === 'remaining') document.getElementById('btnSortRemain').classList.add('active');
        if (sort === 'consumed') document.getElementById('btnSortConsumed').classList.add('active');
        if (sort === 'purchased') document.getElementById('btnSortPurchased').classList.add('active');

        const res = await fetch('/api/board/progress?sort=' + sort);
        const ret = await res.json();
        boardData = ret.data;

        const s = ret.summary;
        document.getElementById('sumStu').innerText = s.total_students + ' 人';
        document.getElementById('sumPurchased').innerText = s.total_purchased + ' h';
        document.getElementById('sumRemaining').innerText = s.total_remaining + ' h';
        
        // 日消课进度渲染
        document.getElementById('sumToday').innerText = s.today_consumed + ' h (' + s.today_lessons + '单)';
        document.getElementById('dayProgressBar').style.width = Math.min(100, s.day_progress_rate) + '%';
        document.getElementById('dayRateTxt').innerText = '进度: ' + s.day_progress_rate + '%';
        document.getElementById('dayTargetTxt').innerText = '日基准: ' + s.day_target + 'h';

        // 周消课进度渲染
        document.getElementById('sumWeek').innerText = s.week_consumed + ' h (' + s.week_lessons + '单)';
        document.getElementById('weekProgressBar').style.width = Math.min(100, s.week_progress_rate) + '%';
        document.getElementById('weekRateTxt').innerText = '进度: ' + s.week_progress_rate + '%';
        document.getElementById('weekTargetTxt').innerText = '周基准: ' + s.week_target + 'h';

        const rate = s.total_purchased > 0 ? ((s.total_consumed / s.total_purchased) * 100).toFixed(1) : 0;
        document.getElementById('sumRate').innerText = rate + '%';

        renderBoardTable(boardData);
      }

      function renderBoardTable(list) {
        const tbody = document.getElementById('boardTableBody');
        tbody.innerHTML = '';
        list.forEach(row => {
          const rate = row.progress_rate || 0;
          const isWarn = parseFloat(row.remaining_hours) <= 5;
          tbody.innerHTML += '<tr>' +
            '<td><b>' + row.student_name + '</b> <small style="color:#888;">(' + row.class_name + ')</small></td>' +
            '<td>' + row.course_type + '</td>' +
            '<td>' + row.purchased_hours + '</td>' +
            '<td style="color:#52C41A;font-weight:bold;">' + row.consumed_hours + '</td>' +
            '<td style="font-weight:bold;color:' + (isWarn ? '#CF1322' : '#FA8C16') + ';">' + row.remaining_hours + (isWarn ? ' ⚠️' : '') + '</td>' +
            '<td>' +
              '<div style="display:flex;align-items:center;gap:6px;">' +
                '<div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + Math.min(rate, 100) + '%;"></div></div>' +
                '<span style="font-size:11px;min-width:35px;font-weight:bold;">' + rate + '%</span>' +
              '</div>' +
            '</td>' +
            '<td><a class="del-btn" onclick="deleteStudentDirect(' + row.student_id + ', \\'' + row.student_name + '\\')">剔除</a></td>' +
          '</tr>';
        });
      }

      // 【核心剔除函数 1】：在进度看板表格内直接点击剔除
      async function deleteStudentDirect(studentId, studentName) {
        if (!confirm('⚠️ 严正确认：您确定要彻底剔除学员【' + studentName + '】吗？\\n此操作将同时清理该学员的所有课包和打卡流水记录！')) return;
        const res = await fetch('/api/students/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId })
        });
        const ret = await res.json();
        alert(ret.message);
        loadBoard(currentSort);
      }

      // 【核心剔除函数 2】：在学员管理面板下拉选择剔除
      async function deleteStudentFromSelect() {
        const studentId = document.getElementById('deleteStudentSelect').value;
        if (!studentId) return alert('请先选择需要剔除的学员！');
        const stuName = document.getElementById('deleteStudentSelect').selectedOptions[0].text;
        if (!confirm('⚠️ 严正确认：确定要彻底剔除学员【' + stuName + '】吗？\\n该学员的数据将永久清理！')) return;

        const res = await fetch('/api/students/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId })
        });
        const ret = await res.json();
        alert(ret.message);
        loadExistingStudents();
      }

      function filterBoardRows() {
        const kw = document.getElementById('boardSearch').value.trim();
        const filtered = boardData.filter(r => r.student_name.includes(kw) || r.course_type.includes(kw));
        renderBoardTable(filtered);
      }

      function exportBoardCSV() {
        let csv = '\uFEFF学生姓名,班级,课程类型,课程名称,总购买课时,累计已消课时,未消课时(剩余),消耗进度\\n';
        boardData.forEach(r => {
          csv += '"' + r.student_name + '","' + r.class_name + '","' + r.course_type + '","' + r.course_name + '",' + r.purchased_hours + ',' + r.consumed_hours + ',' + r.remaining_hours + ',"' + r.progress_rate + '%"\\n';
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '新东方专升本一对一消耗进度看板.csv';
        link.click();
      }

      async function triggerDingSummary() {
        if (!confirm('确定将当前课消大盘日报推送至钉钉群吗？')) return;
        const res = await fetch('/api/ding/sync-summary', { method: 'POST' });
        const ret = await res.json();
        alert(ret.message);
      }

      async function triggerDingWarnings() {
        if (!confirm('确定将所有 <=5h 的预警名单推送至钉钉群吗？')) return;
        const res = await fetch('/api/ding/sync-warnings', { method: 'POST' });
        const ret = await res.json();
        alert(ret.message);
      }

      function loadData() {
        fetch('/api/students').then(r=>r.json()).then(res => {
          allStudents = res.data;
          renderStudentOptions(allStudents);
        });
      }

      function renderStudentOptions(list) {
        const sel = document.getElementById('studentSelect');
        sel.innerHTML = '<option value="">-- 选择学员 (共' + list.length + '人) --</option>';
        list.forEach(s => {
          sel.innerHTML += '<option value="' + s.id + '">' + s.student_name + ' (' + s.student_code + ')</option>';
        });
      }

      function filterStudents() {
        const kw = document.getElementById('searchKeyword').value.trim();
        const filtered = allStudents.filter(s => s.student_name.includes(kw) || s.student_code.includes(kw));
        renderStudentOptions(filtered);
        if (filtered.length === 1) {
          document.getElementById('studentSelect').value = filtered[0].id;
          onSelectStudent();
        }
      }

      async function onSelectStudent() {
        const stuId = document.getElementById('studentSelect').value;
        const pkgSel = document.getElementById('packageSelect');
        document.getElementById('packageDetail').style.display = 'none';
        document.getElementById('stuHistoryBox').style.display = 'none';

        if (!stuId) {
          pkgSel.innerHTML = '<option value="">-- 请先选择学员 --</option>';
          return;
        }

        const res = await fetch('/api/students/' + stuId + '/packages');
        const data = await res.json();
        currentPackages = data.data;

        pkgSel.innerHTML = '<option value="">-- 选择该学员的课包 (' + currentPackages.length + '个) --</option>';
        currentPackages.forEach(p => {
          pkgSel.innerHTML += '<option value="' + p.id + '">' + p.course_type + ' - ' + p.course_name + ' (总' + p.purchased_hours + 'h/未消' + p.remaining_hours + 'h)</option>';
        });

        if (currentPackages.length >= 1) {
          pkgSel.value = currentPackages[0].id;
          onSelectPackage();
        }

        loadStudentRecords(stuId);
      }

      async function loadStudentRecords(stuId) {
        const res = await fetch('/api/students/' + stuId + '/records');
        const data = await res.json();
        const box = document.getElementById('stuHistoryBox');
        const tbody = document.getElementById('stuRecordList');
        tbody.innerHTML = '';
        if (data.data.length > 0) {
          box.style.display = 'block';
          data.data.forEach(r => {
            tbody.innerHTML += '<tr>' +
              '<td>' + r.lesson_date.slice(0,10) + '</td>' +
              '<td>' + r.course_name + '</td>' +
              '<td>' + r.teacher_name + '</td>' +
              '<td style="color:#1E6CEB;font-weight:bold;">' + r.consumed_hours + 'h</td>' +
              '<td>' + r.remaining_hours_snap + 'h</td>' +
              '<td><a class="revoke-btn" onclick="revokeStudentSpecific(' + r.id + ')">撤回</a></td>' +
            '</tr>';
          });
        } else {
          box.style.display = 'none';
        }
      }

      async function revokeStudentSpecific(recordId) {
        if (!confirm('确定撤销该学员此条消课记录吗？课时将立即全额退回学员课包！')) return;
        const res = await fetch('/api/records/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordId })
        });
        const data = await res.json();
        alert(data.message);
        onSelectStudent();
      }

      function onSelectPackage() {
        const pkgId = document.getElementById('packageSelect').value;
        if (!pkgId) {
          document.getElementById('packageDetail').style.display = 'none';
          return;
        }
        const pkg = currentPackages.find(p => p.id == pkgId);
        if (pkg) {
          document.getElementById('pkgType').innerText = pkg.course_type + ' (' + pkg.course_name + ')';
          document.getElementById('pkgTotal').innerText = pkg.purchased_hours + ' 小时';
          document.getElementById('pkgConsumed').innerText = pkg.consumed_hours + ' 小时';
          const rSpan = document.getElementById('pkgRemain');
          const rem = parseFloat(pkg.remaining_hours);
          rSpan.innerText = rem + ' 小时';
          rSpan.className = rem <= 5 ? 'badge-warn' : 'badge-ok';
          document.getElementById('packageDetail').style.display = 'block';
        }
      }

      async function submitLesson() {
        const payload = {
          studentId: document.getElementById('studentSelect').value,
          packageId: document.getElementById('packageSelect').value,
          teacherName: document.getElementById('teacherName').value,
          lessonDate: document.getElementById('lessonDate').value,
          consumedHours: document.getElementById('consumedHours').value,
          remarks: document.getElementById('lessonRemarks').value
        };

        if (!payload.studentId || !payload.packageId) return alert('请先选择消课学员及课包！');
        if (!payload.teacherName.trim()) return alert('请填写授课老师名字！');

        const res = await fetch('/api/records/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const ret = await res.json();

        if (!res.ok) alert(ret.message || '课消失败');
        else {
          alert('✅ 课消成功！已自动计入今日与本周消课进度，最新未消课时：' + ret.remainingHours + ' 小时');
          onSelectStudent();
        }
      }

      function loadExistingStudents() {
        fetch('/api/students').then(r=>r.json()).then(res => {
          const sel = document.getElementById('existStuSelect');
          const delSel = document.getElementById('deleteStudentSelect');
          sel.innerHTML = '<option value="">-- 选择已有学员 --</option>';
          delSel.innerHTML = '<option value="">-- 请选择要剔除的学员 --</option>';
          res.data.forEach(s => {
            sel.innerHTML += '<option value="' + s.id + '">' + s.student_name + ' (' + s.student_code + ')</option>';
            delSel.innerHTML += '<option value="' + s.id + '">' + s.student_name + ' (' + s.student_code + ')</option>';
          });
        });
      }

      async function addNewStudent() {
        const payload = {
          studentName: document.getElementById('newStuName').value,
          studentCode: document.getElementById('newStuCode').value,
          phone: document.getElementById('newStuPhone').value,
          className: document.getElementById('newStuClass').value,
          courseType: document.getElementById('newPkgType').value,
          courseName: document.getElementById('newPkgType').value,
          purchasedHours: document.getElementById('newPkgPur').value,
          consumedHours: document.getElementById('newPkgCon').value
        };

        if (!payload.studentName.trim()) return alert('请输入学员姓名！');

        const res = await fetch('/api/students/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const ret = await res.json();
        if (!res.ok) alert(ret.message);
        else {
          alert('🎉 学员添加成功！已自动加入课消看板。');
          document.getElementById('newStuName').value = '';
          switchTab(0);
        }
      }

      async function addPackageForExisting() {
        const payload = {
          studentId: document.getElementById('existStuSelect').value,
          courseType: document.getElementById('existPkgType').value,
          courseName: document.getElementById('existPkgType').value,
          purchasedHours: document.getElementById('existPkgPur').value,
          consumedHours: 0
        };

        if (!payload.studentId) return alert('请选择学员！');

        const res = await fetch('/api/packages/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const ret = await res.json();
        if (!res.ok) alert(ret.message);
        else {
          alert('🎉 课包追加成功！');
          switchTab(0);
        }
      }

      async function loadTeacherStats() {
        const res = await fetch('/api/stats/teachers');
        const data = await res.json();
        const tbody = document.getElementById('teacherStatTable');
        tbody.innerHTML = '';
        if (!data.data.length) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#888;">暂无新课消（期初导入的课包不计入今日/本周上课流水）</td></tr>';
          return;
        }
        data.data.forEach(t => {
          tbody.innerHTML += '<tr><td><b>' + t.teacher_name + '</b></td><td style="color:#1E6CEB;font-weight:bold;">' + t.total_hours + ' 小时</td><td>' + t.total_lessons + ' 单</td><td>' + t.student_count + ' 人</td></tr>';
        });
      }

      async function loadRecords() {
        const res = await fetch('/api/records');
        const data = await res.json();
        const tbody = document.getElementById('recordTable');
        tbody.innerHTML = '';
        if (!data.data.length) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;">暂无课消流水（期初导入的课包不计入今日/本周课消）</td></tr>';
          return;
        }
        data.data.forEach(r => {
          tbody.innerHTML += '<tr>' +
            '<td>' + r.lesson_date.slice(0,10) + '</td>' +
            '<td>' + r.student_name + '</td>' +
            '<td>' + r.course_type + '</td>' +
            '<td>' + r.teacher_name + '</td>' +
            '<td style="color:#1E6CEB;font-weight:bold;">' + r.consumed_hours + '</td>' +
            '<td>' + r.remaining_hours_snap + '</td>' +
            '<td><a class="revoke-btn" onclick="revokeRecord(' + r.id + ')">撤销</a></td>' +
          '</tr>';
        });
      }

      async function revokeRecord(id) {
        if (!confirm('确定撤销该条消课吗？课时将自动退回学生课包！')) return;
        const res = await fetch('/api/records/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordId: id })
        });
        const data = await res.json();
        alert(data.message);
        loadRecords();
        if (document.getElementById('studentSelect').value) onSelectStudent();
      }

      async function loadWarnings() {
        const res = await fetch('/api/stats/warnings');
        const data = await res.json();
        const tbody = document.getElementById('warningTable');
        tbody.innerHTML = '';
        if (!data.data.length) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">目前没有低于5小时课时的学员</td></tr>';
          return;
        }
        data.data.forEach(w => {
          tbody.innerHTML += '<tr>' +
            '<td><b>' + w.student_name + '</b> (' + w.student_code + ')</td>' +
            '<td>' + w.course_type + '</td>' +
            '<td>' + w.course_name + '</td>' +
            '<td><span class="badge-warn">仅剩 ' + w.remaining_hours + ' 小时</span></td>' +
          '</tr>';
        });
      }

      function loadDingConfig() {
        fetch('/api/ding-config').then(r=>r.json()).then(res => {
          if (res.data && res.data.webhook_url) {
            document.getElementById('dingWebhook').value = res.data.webhook_url;
          }
        });
      }

      async function saveDingConfig() {
        const webhook_url = document.getElementById('dingWebhook').value.trim();
        const res = await fetch('/api/ding-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhook_url })
        });
        if (res.ok) alert('钉钉机器人 Webhook 已成功保存并启用！');
      }
    </script>
  </body>
  </html>
  `);
});

initDatabaseAndData().then(() => {
  app.listen(3000, '0.0.0.0', () => {
    console.log('✅ 新东方专升本一对一课消系统已全面更新并启动！端口: 3000');
  });
});