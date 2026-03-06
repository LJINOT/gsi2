import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { taskActions, fetchTasks } from '../store';
import { Plus, Search, CheckCircle2, Circle, Trash2 } from 'lucide-react-native';

const TasksScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: tasks, loading, filter, searchQuery } = useSelector(state => state.tasks);
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleToggleTask = (task) => {
    dispatch(taskActions.updateTask({
      ...task,
      completed: !task.completed,
    }));
  };

  const handleDeleteTask = (taskId) => {
    dispatch(taskActions.deleteTask(taskId));
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(localSearch.toLowerCase()) ||
                         task.description.toLowerCase().includes(localSearch.toLowerCase());
    const matchesFilter = filter === 'all' ||
                         (filter === 'pending' && !task.completed) ||
                         (filter === 'completed' && task.completed);
    return matchesSearch && matchesFilter;
  });

  const renderTaskItem = ({ item }) => (
    <View style={{
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: '#1E293B',
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: item.completed ? '#64748B' : getDifficultyColor(item.difficulty),
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', gap: 12 }}
          onPress={() => handleToggleTask(item)}
        >
          {item.completed ? (
            <CheckCircle2 size={24} color="#10B981" style={{ marginTop: 2 }} />
          ) : (
            <Circle size={24} color="#818CF8" style={{ marginTop: 2 }} />
          )}

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 15,
              fontWeight: '600',
              color: item.completed ? '#64748B' : '#E0E7FF',
              textDecorationLine: item.completed ? 'line-through' : 'none',
              marginBottom: 4,
            }}>
              {item.title}
            </Text>

            <Text style={{
              fontSize: 13,
              color: '#94A3B8',
              marginBottom: 8,
              lineHeight: 18,
            }} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{
                backgroundColor: '#0F172A',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}>
                <Text style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  fontWeight: '500',
                }}>
                  {item.estimatedDuration}m
                </Text>
              </View>

              <View style={{
                backgroundColor: getDifficultyColor(item.difficulty) + '20',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}>
                <Text style={{
                  fontSize: 11,
                  color: getDifficultyColor(item.difficulty),
                  fontWeight: '500',
                }}>
                  {item.difficulty}
                </Text>
              </View>

              {item.category && (
                <View style={{
                  backgroundColor: '#334155',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}>
                  <Text style={{
                    fontSize: 11,
                    color: '#CBD5E1',
                    fontWeight: '500',
                  }}>
                    {item.category}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ paddingLeft: 12 }}
          onPress={() => handleDeleteTask(item.id)}
        >
          <Trash2 size={18} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#0F172A',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#E0E7FF',
          }}>
            Tasks
          </Text>

          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              backgroundColor: '#818CF8',
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('AddTask')}
          >
            <Plus size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#1E293B',
          borderRadius: 10,
          paddingHorizontal: 12,
          gap: 8,
        }}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 10,
              fontSize: 14,
              color: '#E0E7FF',
            }}
            placeholder="Search tasks..."
            placeholderTextColor="#64748B"
            value={localSearch}
            onChangeText={setLocalSearch}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
      }}>
        {['all', 'pending', 'completed'].map(f => (
          <TouchableOpacity
            key={f}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: filter === f ? '#818CF8' : '#1E293B',
              borderRadius: 8,
            }}
            onPress={() => dispatch(taskActions.setFilter(f))}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: filter === f ? '#0F172A' : '#CBD5E1',
              textTransform: 'capitalize',
            }}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingVertical: 12 }}
        scrollEnabled={true}
        ListEmptyComponent={
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60,
          }}>
            <Text style={{
              fontSize: 16,
              color: '#64748B',
              textAlign: 'center',
            }}>
              No tasks found
            </Text>
          </View>
        }
      />
    </View>
  );
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return '#10B981';
    case 'medium': return '#F59E0B';
    case 'hard': return '#EF4444';
    default: return '#818CF8';
  }
};

export default TasksScreen;
