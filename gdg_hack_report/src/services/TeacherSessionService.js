// Teacher Session Service - Stores and manages teaching session reports
// Links sessions to specific teachers and provides analytics aggregation

class TeacherSessionService {
  constructor() {
    this.dbKey = 'edupulse_teacher_sessions';
    this.teacherStatsKey = 'edupulse_teacher_stats';
  }

  // Get all sessions for a teacher
  getTeacherSessions(teacherId) {
    const sessions = this.getAllSessions();
    return sessions.filter(s => s.teacherId === teacherId);
  }

  // Get all stored sessions
  getAllSessions() {
    try {
      const stored = localStorage.getItem(this.dbKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading sessions:', e);
      return [];
    }
  }

  // Save a new session report
  saveSession(report, teacherInfo) {
    try {
      const sessions = this.getAllSessions();
      
      const sessionRecord = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        teacherId: teacherInfo.id || teacherInfo.name.toLowerCase().replace(/\s+/g, '-'),
        teacherName: teacherInfo.name,
        teacherEmail: teacherInfo.email || '',
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        
        // Report data
        topic: report.topic,
        subject: report.subject,
        grade: report.grade,
        status: report.status,
        onTopicPercentage: report.onTopicPercentage || 0,
        totalDuration: report.totalDuration || 0,
        
        // Teaching metrics
        teachingMetrics: report.teachingMetrics || {},
        questionsAsked: report.questionsAsked || 0,
        examplesGiven: report.examplesGiven || 0,
        wordsPerMinute: report.wordsPerMinute || 0,
        
        // Feedback
        strengths: report.strengths || [],
        improvements: report.improvements || [],
        suggestions: report.suggestions || []
      };
      
      sessions.unshift(sessionRecord); // Add to beginning
      
      // Keep only last 100 sessions
      const trimmedSessions = sessions.slice(0, 100);
      localStorage.setItem(this.dbKey, JSON.stringify(trimmedSessions));
      
      // Update aggregated teacher stats
      this.updateTeacherStats(sessionRecord);
      
      return sessionRecord;
    } catch (e) {
      console.error('Error saving session:', e);
      return null;
    }
  }

  // Update aggregated stats for a teacher
  updateTeacherStats(session) {
    try {
      const allStats = this.getAllTeacherStats();
      const teacherId = session.teacherId;
      
      if (!allStats[teacherId]) {
        allStats[teacherId] = {
          teacherId: session.teacherId,
          teacherName: session.teacherName,
          teacherEmail: session.teacherEmail,
          totalSessions: 0,
          totalDuration: 0,
          averageOnTopic: 0,
          averageGrade: 0,
          gradeHistory: [],
          onTopicHistory: [],
          subjects: {},
          lastSessionDate: null,
          sessions: []
        };
      }
      
      const stats = allStats[teacherId];
      stats.totalSessions += 1;
      stats.totalDuration += session.totalDuration || 0;
      stats.lastSessionDate = session.timestamp;
      stats.teacherName = session.teacherName; // Update in case name changed
      
      // Track grade history (last 10)
      const gradeValue = this.gradeToNumber(session.grade);
      stats.gradeHistory.push(gradeValue);
      if (stats.gradeHistory.length > 10) stats.gradeHistory.shift();
      stats.averageGrade = stats.gradeHistory.reduce((a, b) => a + b, 0) / stats.gradeHistory.length;
      
      // Track on-topic percentage history (last 10)
      stats.onTopicHistory.push(session.onTopicPercentage);
      if (stats.onTopicHistory.length > 10) stats.onTopicHistory.shift();
      stats.averageOnTopic = Math.round(stats.onTopicHistory.reduce((a, b) => a + b, 0) / stats.onTopicHistory.length);
      
      // Track subjects taught
      if (session.subject) {
        if (!stats.subjects[session.subject]) {
          stats.subjects[session.subject] = { count: 0, topics: [] };
        }
        stats.subjects[session.subject].count += 1;
        if (session.topic && !stats.subjects[session.subject].topics.includes(session.topic)) {
          stats.subjects[session.subject].topics.push(session.topic);
        }
      }
      
      // Store last 5 session summaries
      stats.sessions.unshift({
        id: session.id,
        date: session.date,
        topic: session.topic,
        subject: session.subject,
        grade: session.grade,
        onTopicPercentage: session.onTopicPercentage,
        duration: session.totalDuration
      });
      if (stats.sessions.length > 5) stats.sessions.pop();
      
      localStorage.setItem(this.teacherStatsKey, JSON.stringify(allStats));
      
      return stats;
    } catch (e) {
      console.error('Error updating teacher stats:', e);
      return null;
    }
  }

  // Get all teacher stats
  getAllTeacherStats() {
    try {
      const stored = localStorage.getItem(this.teacherStatsKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading teacher stats:', e);
      return {};
    }
  }

  // Get stats for a specific teacher
  getTeacherStats(teacherId) {
    const allStats = this.getAllTeacherStats();
    return allStats[teacherId] || null;
  }

  // Get stats by teacher name
  getTeacherStatsByName(teacherName) {
    const teacherId = teacherName.toLowerCase().replace(/\s+/g, '-');
    return this.getTeacherStats(teacherId);
  }

  // Convert grade letter to number for averaging
  gradeToNumber(grade) {
    const gradeMap = {
      'A+': 100, 'A': 90, 'B+': 85, 'B': 80,
      'C+': 75, 'C': 70, 'D': 60, 'F': 40
    };
    return gradeMap[grade] || 50;
  }

  // Convert number back to grade letter
  numberToGrade(num) {
    if (num >= 95) return 'A+';
    if (num >= 85) return 'A';
    if (num >= 80) return 'B+';
    if (num >= 75) return 'B';
    if (num >= 70) return 'C+';
    if (num >= 65) return 'C';
    if (num >= 55) return 'D';
    return 'F';
  }

  // Get recent sessions across all teachers
  getRecentSessions(limit = 10) {
    const sessions = this.getAllSessions();
    return sessions.slice(0, limit);
  }

  // Get teacher rankings
  getTeacherRankings() {
    const allStats = this.getAllTeacherStats();
    const rankings = Object.values(allStats)
      .filter(s => s.totalSessions >= 1)
      .map(s => ({
        ...s,
        averageGradeLetter: this.numberToGrade(s.averageGrade),
        status: s.averageOnTopic >= 80 ? 'Exemplary' : 
                s.averageOnTopic >= 65 ? 'Good' :
                s.averageOnTopic >= 50 ? 'Satisfactory' : 'Needs Improvement'
      }))
      .sort((a, b) => b.averageGrade - a.averageGrade);
    
    return rankings;
  }

  // Clear all data (for testing)
  clearAllData() {
    localStorage.removeItem(this.dbKey);
    localStorage.removeItem(this.teacherStatsKey);
  }
}

export const teacherSessionService = new TeacherSessionService();
export default teacherSessionService;
