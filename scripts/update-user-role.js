/**
 * Script to update a user's profile_type to 'admin'
 * Usage: node update-user-role.js <user-id> <new-role>
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wsdkieldyvehoqtukyis.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZGtpZWxkeXZlaG9xdHVreWlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUxNjQ5NywiZXhwIjoyMDg1MDkyNDk3fQ.ReOiwzEwVVJJ9h4Y6qh0TLXjPEE7uQ2IdtxWPjjTc50';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateUserRole(userId, newRole = 'admin') {
    try {
        console.log(`Updating user ${userId} to role: ${newRole}`);

        // Update the profile_type in the profiles table
        const { data, error } = await supabase
            .from('profiles')
            .update({ profile_type: newRole })
            .eq('id', userId)
            .select();

        if (error) {
            console.error('Error updating profile:', error);
            return false;
        }

        console.log('Profile updated successfully:', data);

        // Also update the user metadata in auth.users if needed
        // Note: This requires admin privileges and the user to be logged in
        const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { role: newRole }
        });

        if (authError) {
            console.warn('Could not update auth metadata (this is normal if user not logged in):', authError);
        } else {
            console.log('Auth metadata updated:', authData);
        }

        return true;
    } catch (err) {
        console.error('Unexpected error:', err);
        return false;
    }
}

// Get user ID from command line arguments
const userId = process.argv[2];
const newRole = process.argv[3] || 'admin';

if (!userId) {
    console.error('Usage: node update-user-role.js <user-id> [new-role]');
    console.error('Example: node update-user-role.js 81235503-b233-4243-b71a-15f59b6a56d1 admin');
    process.exit(1);
}

updateUserRole(userId, newRole).then(success => {
    if (success) {
        console.log('User role updated successfully!');
    } else {
        console.error('Failed to update user role');
        process.exit(1);
    }
});