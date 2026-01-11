import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockClassAnalytics, mockTeachers, demoUsers } from '../../utils/mockData';
import { StatCard } from '../../components/StatCard';
import { Clock, Users, TrendingUp, Zap, Award, BookOpen, Calendar, RefreshCw } from 'lucide-react';
import { teacherSessionService } from '../../services/TeacherSessionService';
import { useAuth } from '../../context/AuthContext';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [teacherStats, setTeacherStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Find logged in teacher or use first teacher
  const currentTeacherUser = user?.role === 'teacher' 
    ? demoUsers.find(u => u.name === user.name && u.role === 'teacher')
    : demoUsers.find(u => u.role === 'teacher');
  
  const currentTeacher = mockTeachers.find(t => t.name === currentTeacherUser?.name) || mockTeachers[0];
  const analytics = mockClassAnalytics;

  // Load teacher session stats
  useEffect(() => {
    if (currentTeacherUser) {
      const stats = teacherSessionService.getTeacherStatsByName(currentTeacherUser.name);
      setTeacherStats(stats);
      
      const sessions = teacherSessionService.getTeacherSessions(
        currentTeacherUser.name.toLowerCase().replace(/\s+/g, '-')
      );
      setRecentSessions(sessions.slice(0, 5));
    }
  }, [currentTeacherUser, refreshKey]);

  const colors = ['#059669', '#ef4444'];

  // Calculate dynamic data from sessions
  const getPerformanceData = () => {
    if (teacherStats?.onTopicHistory?.length > 0) {
      return teacherStats.onTopicHistory.map((val, idx) => ({
        date: `Session ${idx + 1}`,
        percentage: val
      }));
    }
    return currentTeacher.trends;
  };

  const getOverallPerformance = () => {
    if (teacherStats) {
      return teacherStats.averageOnTopic || 0;
    }
    return currentTeacher.onTopicPercentage;
  };

  const getTotalSessions = () => {
    if (teacherStats) {
      return teacherStats.totalSessions;
    }
    return currentTeacher.totalSessions;
  };

  const getAverageGrade = () => {
    if (teacherStats) {
      return teacherSessionService.numberToGrade(teacherStats.averageGrade);
    }
    return 'B+';
  };

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'text-green-600';
    if (grade === 'B+' || grade === 'B') return 'text-blue-600';
    if (grade === 'C+' || grade === 'C') return 'text-yellow-600';
    return 'text-orange-600';
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-edu-dark-blue">Teacher Dashboard</h1>
          <p className="text-edu-slate mt-1">Welcome, {currentTeacherUser?.name || 'Teacher'}</p>
        </div>
        <button 
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Current Session Info */}
      <div className="bg-gradient-to-r from-edu-blue to-blue-600 rounded-lg shadow-md p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-white/80 text-sm">Teacher</p>
            <p className="text-xl font-bold mt-1">{currentTeacherUser?.name || 'Dr. Priya Sharma'}</p>
            <p className="text-white/60 text-sm mt-1">{currentTeacher.subject}</p>
          </div>
          <div>
            <p className="text-white/80 text-sm">Total Sessions</p>
            <p className="text-2xl font-bold mt-1">{getTotalSessions()}</p>
          </div>
          <div>
            <p className="text-white/80 text-sm">Average Grade</p>
            <p className="text-2xl font-bold mt-1">{getAverageGrade()}</p>
          </div>
          <div>
            <p className="text-white/80 text-sm">Overall Performance</p>
            <p className="text-2xl font-bold mt-1">{getOverallPerformance()}%</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="On-Topic Average"
          value={`${getOverallPerformance()}%`}
          subtitle={teacherStats ? `From ${teacherStats.totalSessions} sessions` : 'Based on mock data'}
          icon={Clock}
          color="green"
        />
        <StatCard
          title="Teaching Sessions"
          value={getTotalSessions()}
          subtitle="Total completed sessions"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Average Grade"
          value={getAverageGrade()}
          subtitle={teacherStats?.status || currentTeacher.status}
          icon={Award}
          color="green"
        />
        <StatCard
          title="Subjects Taught"
          value={teacherStats?.subjects ? Object.keys(teacherStats.subjects).length : 1}
          subtitle="Active subject areas"
          icon={BookOpen}
          color="blue"
        />
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-edu-dark-blue mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Teaching Sessions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Subject</th>
                  <th className="text-left p-3">Topic</th>
                  <th className="text-center p-3">On-Topic %</th>
                  <th className="text-center p-3">Grade</th>
                  <th className="text-center p-3">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session, idx) => (
                  <tr key={session.id || idx} className="border-b hover:bg-gray-50">
                    <td className="p-3">{session.date}</td>
                    <td className="p-3">{session.subject}</td>
                    <td className="p-3">{session.topic}</td>
                    <td className="p-3 text-center">
                      <span className={`font-semibold ${session.onTopicPercentage >= 70 ? 'text-green-600' : session.onTopicPercentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {session.onTopicPercentage}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-bold ${getGradeColor(session.grade)}`}>{session.grade}</span>
                    </td>
                    <td className="p-3 text-center">{session.totalDuration || session.duration} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-Topic vs Off-Topic */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-edu-dark-blue mb-4">Lecture Focus Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.currentLecture.topicBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="topic" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                labelStyle={{ color: '#0f172a' }}
              />
              <Bar dataKey="value" name="Minutes" radius={[8, 8, 0, 0]}>
                {analytics.currentLecture.topicBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-edu-dark-blue mb-4">Performance Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getPerformanceData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#475569" />
              <YAxis stroke="#475569" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                labelStyle={{ color: '#0f172a' }}
              />
              <Line 
                type="monotone" 
                dataKey="percentage" 
                stroke="#059669" 
                strokeWidth={2}
                dot={{ fill: '#059669', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-edu-light-green rounded-lg shadow-md p-6">
          <h3 className="font-bold text-edu-dark-blue mb-3">✅ Strengths</h3>
          <ul className="space-y-2 text-sm text-edu-dark-blue">
            {getOverallPerformance() >= 70 && <li>• Excellent on-topic focus ({getOverallPerformance()}%)</li>}
            {getTotalSessions() >= 5 && <li>• Consistent teaching practice ({getTotalSessions()} sessions)</li>}
            {teacherStats?.subjects && Object.keys(teacherStats.subjects).length > 1 && (
              <li>• Versatile across {Object.keys(teacherStats.subjects).length} subjects</li>
            )}
            <li>• Active engagement with classroom monitoring</li>
          </ul>
        </div>

        <div className="bg-blue-50 rounded-lg shadow-md p-6">
          <h3 className="font-bold text-edu-dark-blue mb-3">💡 Recommendations</h3>
          <ul className="space-y-2 text-sm text-edu-dark-blue">
            {getOverallPerformance() < 70 && <li>• Focus more on staying on-topic during lectures</li>}
            {getTotalSessions() < 10 && <li>• Use the monitoring system more frequently</li>}
            <li>• Review session reports to identify patterns</li>
            <li>• Experiment with interactive teaching techniques</li>
          </ul>
        </div>
      </div>

      {/* No Data Message */}
      {!teacherStats && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">📊 No session data recorded yet</p>
          <p className="text-yellow-600 text-sm mt-1">
            Go to "Live Classroom Monitor" and complete a teaching session to see your analytics here!
          </p>
        </div>
      )}
    </div>
  );
};
