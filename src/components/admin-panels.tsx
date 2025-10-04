'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin-api-client';
import { UserProfile, PlayerStatsWithDetails, PaginatedResponse } from '@/lib/api/admin-service';

// User Roles Management Component
export const UserRolesManagement = () => {
  const [users, setUsers] = useState<PaginatedResponse<UserProfile>>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getUserProfiles(currentPage, 10, searchTerm);
      setUsers(result);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserProfile['role']) => {
    try {
      const result = await adminApi.updateUserRole({ userId, role: newRole });
      // Update the local state to reflect the change
      setUsers(prev => ({
        ...prev,
        data: prev.data.map(user => 
          user.id === userId ? { ...result.data } : user
        )
      }));
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const totalPages = Math.ceil(users.total / users.limit);

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-md border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-white">User Roles Management</h2>
      
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-gray-700 text-white"
          />
          <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-sm">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email/Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Current Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Update Role</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {users.data.map(user => (
                <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{user.full_name || user.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{user.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'superAdmin' ? 'bg-green-600 text-gray-900' :
                      user.role === 'capitan' ? 'bg-blue-500 text-gray-900' :
                      user.role === 'arbitro' ? 'bg-yellow-500 text-gray-900' :
                      'bg-gray-600 text-gray-900'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserProfile['role'])}
                      className="block w-full px-3 py-1 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white"
                    >
                      <option value="superAdmin" className="bg-gray-700 text-white">Super Admin</option>
                      <option value="capitan" className="bg-gray-700 text-white">Captain</option>
                      <option value="arbitro" className="bg-gray-700 text-white">Referee</option>
                      <option value="invitado" className="bg-gray-700 text-white">Guest</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-6 border-t border-gray-700 px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-700 bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages || 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-700 bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">
              Showing <span className="font-medium text-white">{(currentPage - 1) * users.limit + 1}</span> to{' '}
              <span className="font-medium text-white">
                {Math.min(currentPage * users.limit, users.total)}
              </span>{' '}
              of <span className="font-medium text-white">{users.total}</span> users
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Calculate page numbers to display
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNum
                        ? 'z-10 bg-green-600 text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
                        : 'text-white ring-1 ring-inset ring-gray-700 hover:bg-gray-700'
                    } focus:outline-offset-0`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages || 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

// Player Stats Management Component
export const PlayerStatsManagement = () => {
  const [stats, setStats] = useState<PaginatedResponse<PlayerStatsWithDetails>>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    tournament_id: '',
    team_id: '',
    player_name: '',
    position: '',
    min_goals: '',
    max_goals: '',
    min_assists: '',
    max_assists: '',
    min_minutes: '',
    max_minutes: ''
  });
  const [sort, setSort] = useState({ field: 'goals', order: 'desc' as 'asc' | 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState({
    tournaments: [] as { id: string; name: string }[],
    teams: [] as { id: string; name: string }[],
    positions: [] as string[]
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchPlayerStats();
  }, [currentPage, filters, sort]);

  const fetchFilterOptions = async () => {
    try {
      const options = await adminApi.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchPlayerStats = async () => {
    setLoading(true);
    try {
      // Convert string values to numbers for filters where needed
      const convertedFilters = {
        ...filters,
        min_goals: filters.min_goals ? parseInt(filters.min_goals) : undefined,
        max_goals: filters.max_goals ? parseInt(filters.max_goals) : undefined,
        min_assists: filters.min_assists ? parseInt(filters.min_assists) : undefined,
        max_assists: filters.max_assists ? parseInt(filters.max_assists) : undefined,
        min_minutes: filters.min_minutes ? parseInt(filters.min_minutes) : undefined,
        max_minutes: filters.max_minutes ? parseInt(filters.max_minutes) : undefined,
      };

      // Remove empty string filters
      Object.keys(convertedFilters).forEach(key => {
        if (convertedFilters[key as keyof typeof convertedFilters] === '') {
          delete convertedFilters[key as keyof typeof convertedFilters];
        }
      });

      const result = await adminApi.getPlayerStats(
        { page: currentPage, limit: 10 },
        convertedFilters,
        sort
      );

      setStats(result);
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field: string) => {
    if (sort.field === field) {
      // Toggle order if clicking the same field
      setSort(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }));
    } else {
      // Default to ascending when changing field
      setSort({ field, order: 'asc' });
    }
  };

  const handleStatUpdate = async (statId: string, field: string, value: string) => {
    try {
      const updates: any = {};
      updates[field] = parseInt(value) || 0;
      
      const result = await adminApi.updatePlayerStats({ id: statId, ...updates });
      
      // Update the local state
      setStats(prev => ({
        ...prev,
        data: prev.data.map(stat => 
          stat.id === statId ? { ...result.data } : stat
        )
      }));
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const totalPages = Math.ceil(stats.total / stats.limit);

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-md border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-white">Player Stats Management</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tournament</label>
          <select
            value={filters.tournament_id}
            onChange={(e) => handleFilterChange('tournament_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white"
          >
            <option value="" className="bg-gray-700 text-white">All Tournaments</option>
            {filterOptions.tournaments.map(t => (
              <option key={t.id} value={t.id} className="bg-gray-700 text-white">{t.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Team</label>
          <select
            value={filters.team_id}
            onChange={(e) => handleFilterChange('team_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white"
          >
            <option value="" className="bg-gray-700 text-white">All Teams</option>
            {filterOptions.teams.map(t => (
              <option key={t.id} value={t.id} className="bg-gray-700 text-white">{t.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Player Name</label>
          <input
            type="text"
            value={filters.player_name}
            onChange={(e) => handleFilterChange('player_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white"
            placeholder="Search player..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Position</label>
          <select
            value={filters.position}
            onChange={(e) => handleFilterChange('position', e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white"
          >
            <option value="" className="bg-gray-700 text-white">All Positions</option>
            {filterOptions.positions.map(p => (
              <option key={p} value={p} className="bg-gray-700 text-white">{p}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Min Goals</label>
          <input
            type="number"
            value={filters.min_goals}
            onChange={(e) => handleFilterChange('min_goals', e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white"
            placeholder="Min"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Max Goals</label>
          <input
            type="number"
            value={filters.max_goals}
            onChange={(e) => handleFilterChange('max_goals', e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white"
            placeholder="Max"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Min Assists</label>
          <input
            type="number"
            value={filters.min_assists}
            onChange={(e) => handleFilterChange('min_assists', e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white"
            placeholder="Min"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Max Assists</label>
          <input
            type="number"
            value={filters.max_assists}
            onChange={(e) => handleFilterChange('max_assists', e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-700 text-white"
            placeholder="Max"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-sm">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('player_name')}
                >
                  <div className="flex items-center">
                    Player
                    {sort.field === 'player_name' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('team_name')}
                >
                  <div className="flex items-center">
                    Team
                    {sort.field === 'team_name' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('tournament_name')}
                >
                  <div className="flex items-center">
                    Tournament
                    {sort.field === 'tournament_name' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('goals')}
                >
                  <div className="flex items-center">
                    Goals
                    {sort.field === 'goals' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('assists')}
                >
                  <div className="flex items-center">
                    Assists
                    {sort.field === 'assists' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('yellow_cards')}
                >
                  <div className="flex items-center">
                    Yellow Cards
                    {sort.field === 'yellow_cards' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('red_cards')}
                >
                  <div className="flex items-center">
                    Red Cards
                    {sort.field === 'red_cards' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('matches_played')}
                >
                  <div className="flex items-center">
                    Matches
                    {sort.field === 'matches_played' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('minutes_played')}
                >
                  <div className="flex items-center">
                    Minutes
                    {sort.field === 'minutes_played' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('saves_made')}
                >
                  <div className="flex items-center">
                    Saves
                    {sort.field === 'saves_made' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('goals_conceded')}
                >
                  <div className="flex items-center">
                    Conceded
                    {sort.field === 'goals_conceded' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('clean_sheets')}
                >
                  <div className="flex items-center">
                    CS
                    {sort.field === 'clean_sheets' && (
                      <span className="ml-1 text-green-500">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {stats.data.map(stat => (
                <tr key={stat.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{stat.player_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{stat.team_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{stat.tournament_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={stat.goals}
                      onChange={(e) => handleStatUpdate(stat.id, 'goals', e.target.value)}
                      className="w-20 px-3 py-1 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center bg-gray-700 text-white"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={stat.assists}
                      onChange={(e) => handleStatUpdate(stat.id, 'assists', e.target.value)}
                      className="w-20 px-3 py-1 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center bg-gray-700 text-white"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={stat.yellow_cards}
                      onChange={(e) => handleStatUpdate(stat.id, 'yellow_cards', e.target.value)}
                      className="w-20 px-3 py-1 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center bg-gray-700 text-white"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={stat.red_cards}
                      onChange={(e) => handleStatUpdate(stat.id, 'red_cards', e.target.value)}
                      className="w-20 px-3 py-1 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center bg-gray-700 text-white"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={stat.matches_played}
                      onChange={(e) => handleStatUpdate(stat.id, 'matches_played', e.target.value)}
                      className="w-20 px-3 py-1 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center bg-gray-700 text-white"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={stat.minutes_played}
                      onChange={(e) => handleStatUpdate(stat.id, 'minutes_played', e.target.value)}
                      className="w-20 px-3 py-1 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center bg-gray-700 text-white"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={stat.saves_made}
                      onChange={(e) => handleStatUpdate(stat.id, 'saves_made', e.target.value)}
                      className="w-20 px-3 py-1 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center bg-gray-700 text-white"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={stat.goals_conceded}
                      onChange={(e) => handleStatUpdate(stat.id, 'goals_conceded', e.target.value)}
                      className="w-20 px-3 py-1 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center bg-gray-700 text-white"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      value={stat.clean_sheets}
                      onChange={(e) => handleStatUpdate(stat.id, 'clean_sheets', e.target.value)}
                      className="w-20 px-3 py-1 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center bg-gray-700 text-white"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-6 border-t border-gray-700 px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-700 bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages || 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-700 bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">
              Showing <span className="font-medium text-white">{(currentPage - 1) * stats.limit + 1}</span> to{' '}
              <span className="font-medium text-white">
                {Math.min(currentPage * stats.limit, stats.total)}
              </span>{' '}
              of <span className="font-medium text-white">{stats.total}</span> records
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Calculate page numbers to display
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNum
                        ? 'z-10 bg-green-600 text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
                        : 'text-white ring-1 ring-inset ring-gray-700 hover:bg-gray-700'
                    } focus:outline-offset-0`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages || 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};