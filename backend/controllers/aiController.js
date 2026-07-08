const { GoogleGenerativeAI } = require('@google/generative-ai');
const Report = require('../models/Report');
const User = require('../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Fetch recent reports with user and project info to give Gemini real context
    const reports = await Report.find({})
      .populate('userId', 'name email role')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    // Build a structured context string from real report data
    const reportContext = reports.length > 0
      ? reports.map(r => {
          const userName = r.userId?.name || 'Unknown';
          const projectName = r.projectId?.name || 'No Project';
          const week = r.weekStartDate ? new Date(r.weekStartDate).toDateString() : 'Unknown week';
          return [
            `--- Report by ${userName} (${projectName}, Week of ${week}) ---`,
            `Status: ${r.status}`,
            `Tasks Completed: ${r.tasksCompleted || 'N/A'}`,
            `Tasks Planned: ${r.tasksPlanned || 'N/A'}`,
            `Blockers: ${r.blockers || 'None'}`,
            `Hours Worked: ${r.hoursWorked || 'Not specified'}`,
            `Notes: ${r.notes || 'None'}`,
          ].join('\n');
        }).join('\n\n')
      : 'No reports have been submitted yet.';

    const systemPrompt = `You are an intelligent team analytics assistant embedded in a Weekly Report Dashboard application.
You help managers understand their team's progress, blockers, and workload based on submitted weekly reports.

Here is the current team report data:

${reportContext}

Guidelines:
- Answer questions concisely and clearly based on the report data above.
- If asked about specific people or projects, reference the actual data.
- If data is missing or reports are empty, let the user know.
- You can highlight blockers, workload distribution, and team performance patterns.
- Be friendly and professional.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood! I have access to the team report data. How can I help you analyze your team\'s performance?' }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
};
