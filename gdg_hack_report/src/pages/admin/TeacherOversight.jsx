import { useState, useEffect } from 'react';
import { mockTeachers } from '../../utils/mockData';
import { TrendingUp, TrendingDown, CheckCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { teacherSessionService } from '../../services/TeacherSessionService';

export const TeacherOversight = () => {
  const [teacherRankings, setTeacherRankings] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load teacher rankings from session service and merge with mock data
  useEffect(() => {
    const sessionRankings = teacherSessionService.getTeacherRankings();
    
    // Create a combined list: real data takes priority
    const teacherMap = new Map();
    
    // First add mock teachers
    mockTeachers.forEach(t => {
      teacherMap.set(t.name.toLowerCase(), {
        ...t,
        source: 'mock',
        averageGradeLetter: 'B+',
        totalSessionsRecorded: 0
      });
    });
    
    // Override with real session data where available
    sessionRankings.forEach(r => {
      const existing = teacherMap.get(r.teacherName.toLowerCase());
      if (existing) {
        teacherMap.set(r.teacherName.toLowerCase(), {
          ...existing,
          onTopicPercentage: r.averageOnTopic,
          averageGradeLetter: r.averageGradeLetter,
          status: r.status,
          totalSessionsRecorded: r.totalSessions,
          lastSession: r.lastSessionDate ? new Date(r.lastSessionDate).toLocaleDateString() : existing.lastSession,
          source: 'live'
        });
      } else {
        // New teacher from sessions
        teacherMap.set(r.teacherName.toLowerCase(), {
          id: r.teacherId,
          name: r.teacherName,
          subject: Object.keys(r.subjects || {})[0] || 'General',
          onTopicPercentage: r.averageOnTopic,
          averageEngagement: r.averageOnTopic,
          averageGradeLetter: r.averageGradeLetter,
          status: r.status,
          curriculumCovered: r.averageOnTopic,
          totalSessionsRecorded: r.totalSessions,
          lastSession: r.lastSessionDate ? new Date(r.lastSessionDate).toLocaleDateString() : 'N/A',
          source: 'live'
        });
      }
    });
    
    const combined = Array.from(teacherMap.values())
      .sort((a, b) => b.onTopicPercentage - a.onTopicPercentage);
    
    setTeacherRankings(combined);
  }, [refreshKey]);

  const getStatusColor = (percentage) => {
    return percentage >= 75 ? 'text-edu-green bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getStatusBadge = (percentage) => {
    return percentage >= 75 ? 'bg-edu-green text-white' : 'bg-red-100 text-red-800';
  };

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'text-green-600 bg-green-100';
    if (grade === 'B+' || grade === 'B') return 'text-blue-600 bg-blue-100';
    if (grade === 'C+' || grade === 'C') return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-edu-dark-blue">Teacher Oversight</h1>
          <p className="text-edu-slate mt-1">Monitor teacher performance across the school</p>
        </div>
        <button 
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Teacher Rankings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-edu-dark-blue text-white flex justify-between items-center">
          <h2 className="text-lg font-bold">Teacher Rankings by On-Topic Performance</h2>
          <span className="text-sm bg-white/20 px-3 py-1 rounded">
            <BarChart2 className="w-4 h-4 inline mr-1" />
            {teacherRankings.filter(t => t.source === 'live').length} with live data
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-edu-light-slate">
                <th className="px-6 py-3 text-left text-sm font-semibold text-edu-dark-blue">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-edu-dark-blue">Teacher Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-edu-dark-blue">Subject</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-edu-dark-blue">On-Topic %</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-edu-dark-blue">Avg Grade</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-edu-dark-blue">Sessions</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-edu-dark-blue">Status</th>
              </tr>
            </thead>
            <tbody>
              {teacherRankings.map((teacher, index) => (
                <tr key={teacher.id || index} className={`border-b border-edu-light-slate hover:bg-edu-light-slate/30 transition-colors ${teacher.source === 'live' ? 'bg-green-50/30' : ''}`}>
                  <td className="px-6 py-4 text-sm font-semibold text-edu-dark-blue">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <p className="font-semibold text-edu-dark-blue">{teacher.name}</p>
                      <p className="text-xs text-edu-slate">
                        {teacher.source === 'live' ? (
                          <span className="text-green-600">📊 Live data • Last: {teacher.lastSession}</span>
                        ) : (
                          <span>Last session: {teacher.lastSession}</span>
                        )}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-edu-slate">{teacher.subject}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-edu-dark-blue">{teacher.onTopicPercentage}%</span>
                      {teacher.onTopicPercentage >= 75 ? (
                        <TrendingUp size={18} className="text-edu-green" />
                      ) : (
                        <TrendingDown size={18} className="text-red-600" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-sm font-bold ${getGradeColor(teacher.averageGradeLetter)}`}>
                      {teacher.averageGradeLetter || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-edu-dark-blue font-semibold">
                    {teacher.totalSessionsRecorded || teacher.totalSessions || 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(teacher.onTopicPercentage)}`}>
                      {teacher.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-edu-light-green rounded-lg shadow-md p-6">
          <h3 className="font-bold text-edu-dark-blue mb-3 flex items-center gap-2">
            <CheckCircle size={20} className="text-edu-green" />
            Exemplary Teachers
          </h3>
          <ul className="space-y-2">
            {teacherRankings.filter(t => t.onTopicPercentage >= 75).map(teacher => (
              <li key={teacher.id} className="text-sm text-edu-dark-blue">
                <span className="font-semibold">{teacher.name}</span> - {teacher.onTopicPercentage}% on-topic
                {teacher.source === 'live' && <span className="ml-2 text-xs text-green-600">(Live)</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-50 rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <h3 className="font-bold text-red-900 mb-3">Needs Improvement</h3>
          <ul className="space-y-2">
            {teacherRankings.filter(t => t.onTopicPercentage < 75).map(teacher => (
              <li key={teacher.id} className="text-sm text-red-800">
                <span className="font-semibold">{teacher.name}</span> - {teacher.onTopicPercentage}% on-topic
                <p className="text-xs text-red-700 mt-1">Below 75% threshold - coaching recommended</p>
              </li>
            ))}
            {teacherRankings.filter(t => t.onTopicPercentage < 75).length === 0 && (
              <li className="text-sm text-green-600">✓ All teachers meeting standards!</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
