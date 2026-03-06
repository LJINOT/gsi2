import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, generateOptimalSchedule, fetchAnalytics } from '../store';
import { Play, Clock, Target, TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: tasks } = useSelector(state => state.tasks);
  const { optimizedSchedule } = useSelector(state => state.schedule);
  const { statistics } = useSelector(state => state.timesheet);
  const { completionRate } = useSelector(state => state.analytics);
  const { workHours } = useSelector(state => state.settings);

  const [todaysTasks, setTodaysTasks] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(generateOptimalSchedule());
    dispatch(fetchAnalytics());
  }, [dispatch]);

  useEffect(() => {
    const today = new Date().toDateString();
    const filtered = tasks.filter(t => new Date(t.dueDate).toDateString() === today && !t.completed);
    setTodaysTasks(filtered);
  }, [tasks]);

  const nextTask = todaysTasks[0];
  const tasksCompleted = tasks.filter(t => t.completed).length;
  const totalScheduled = optimizedSchedule.length;

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#0F172A',
        paddingTop: 16,
      }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '700',
          color: '#E0E7FF',
          marginBottom: 8,
        }}>
          Today's Flow
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#94A3B8',
        }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
      </View>

      {/* Smart Overview Card */}
      <View style={{
        marginHorizontal: 16,
        marginBottom: 20,
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#818CF8',
      }}>
        <Text style={{
          fontSize: 13,
          fontWeight: '600',
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}>
          Smart Overview
        </Text>
        
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#CBD5E1' }}>Tasks Today</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#818CF8' }}>
              {tasksCompleted}/{todaysTasks.length}
            </Text>
          </View>
          
          <View style={{ height: 1, backgroundColor: '#334155' }} />
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#CBD5E1' }}>Completion Rate</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#10B981' }}>
              {Math.round(completionRate * 100)}%
            </Text>
          </View>
          
          <View style={{ height: 1, backgroundColor: '#334155' }} />
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#CBD5E1' }}>Scheduled</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#F59E0B' }}>
              {totalScheduled}
            </Text>
          </View>
        </View>

        <Text style={{
          fontSize: 12,
          color: '#64748B',
          marginTop: 12,
          fontStyle: 'italic',
        }}>
          Your schedule optimized using PSO algorithm
        </Text>
      </View>

      {/* Next Up Card */}
      {nextTask && (
        <View style={{
          marginHorizontal: 16,
          marginBottom: 20,
          backgroundColor: '#1E293B',
          borderRadius: 16,
          padding: 20,
          borderTopWidth: 2,
          borderTopColor: '#EC4899',
        }}>
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
          }}>
            Next Task
          </Text>
          
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#E0E7FF',
            marginBottom: 8,
          }}>
            {nextTask.title}
          </Text>
          
          <Text style={{
            fontSize: 14,
            color: '#94A3B8',
            marginBottom: 12,
            lineHeight: 20,
          }}>
            {nextTask.description}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 16,
          }}>
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#0F172A',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
            }}>
              <Clock size={16} color="#818CF8" />
              <Text style={{ fontSize: 13, color: '#CBD5E1', fontWeight: '500' }}>
                {nextTask.estimatedDuration}m
              </Text>
            </View>
            
            <View style={{
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: '#0F172A',
              borderRadius: 8,
            }}>
              <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}>Difficulty</Text>
              <Text style={{ fontSize: 13, color: '#CBD5E1', fontWeight: '500' }}>
                {nextTask.difficulty}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={{
              backgroundColor: '#818CF8',
              paddingVertical: 12,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onPress={() => setActiveTimer(nextTask.id)}
          >
            <Play size={18} color="#0F172A" />
            <Text style={{
              color: '#0F172A',
              fontWeight: '700',
              fontSize: 14,
            }}>
              Start Timer
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Schedule Timeline */}
      <View style={{
        marginHorizontal: 16,
        marginBottom: 20,
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
      }}>
        <Text style={{
          fontSize: 13,
          fontWeight: '600',
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}>
          Today's Schedule
        </Text>
        
        {optimizedSchedule.slice(0, 3).map((item, index) => (
          <View key={index} style={{
            marginBottom: index < 2 ? 16 : 0,
            paddingBottom: index < 2 ? 16 : 0,
            borderBottomWidth: index < 2 ? 1 : 0,
            borderBottomColor: '#334155',
          }}>
            <Text style={{
              fontSize: 12,
              color: '#818CF8',
              fontWeight: '600',
              marginBottom: 4,
            }}>
              {item.startTime} - {item.endTime}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#E0E7FF',
              fontWeight: '500',
            }}>
              {item.title}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          style={{ marginTop: 12 }}
          onPress={() => navigation.navigate('Schedule')}
        >
          <Text style={{
            fontSize: 13,
            color: '#818CF8',
            fontWeight: '600',
          }}>
            View Full Schedule →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Productivity Insights */}
      <View style={{
        marginHorizontal: 16,
        marginBottom: 30,
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <TrendingUp size={18} color="#10B981" />
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            AI Insights
          </Text>
        </View>

        <Text style={{
          fontSize: 14,
          color: '#CBD5E1',
          lineHeight: 20,
        }}>
          Your peak productivity hours are 9 AM - 12 PM. The AI has scheduled your most important tasks during this window.
        </Text>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;
