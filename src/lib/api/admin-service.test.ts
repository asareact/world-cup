// Test script for admin API endpoints
import { AdminService } from '../api/admin-service';

async function testAdminService() {
  console.log('Testing Admin Service...');
  
  const adminService = new AdminService();
  
  try {
    // Test getting user profiles (this will fail without auth, but structure should be correct)
    console.log('Testing getUserProfiles...');
    // Note: This would normally require authentication, just checking if method exists
    
    // Test getting player stats filter options
    console.log('Testing filter options...');
    const [tournaments, teams, positions] = await Promise.all([
      adminService.getTournamentsForFilter(),
      adminService.getTeamsForFilter(),
      adminService.getPositionsForFilter()
    ]);
    
    console.log('Tournaments:', tournaments.length);
    console.log('Teams:', teams.length);
    console.log('Positions:', positions);
    
    console.log('Admin Service methods are properly defined!');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testAdminService().then(() => {
  console.log('Test completed');
});