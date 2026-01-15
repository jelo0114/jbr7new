<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', dirname(__FILE__) . '/php_errors.log');

error_log("Starting debug log");

session_start();
require_once 'config/database.php';

// Get messages from session and clear them
$avatar_success = $_SESSION['avatar_success'] ?? null;
$avatar_error = $_SESSION['avatar_error'] ?? null;
unset($_SESSION['avatar_success'], $_SESSION['avatar_error']);

// Get the current tab and subtab from URL
$current_tab = $_GET['tab'] ?? 'overview';
$current_subtab = $_GET['subtab'] ?? 'accountInfo';

// Check if user is logged in
if (!isset($_SESSION['client_logged_in']) || !$_SESSION['client_logged_in']) {
    header("Location: client-login.php");
    exit();
}

// Get user data from session
$user_id = $_SESSION['client_id'];
$username = $_SESSION['client_username'];
$email = $_SESSION['client_email'];
$first_name = $_SESSION['client_first_name'];
$last_name = $_SESSION['client_last_name'];
$mobile_number = $_SESSION['client_contact_number'];

// Debug session data
error_log("Session data - User ID: " . $user_id);
error_log("Session data - Username: " . $username);
error_log("Session data - Email: " . $email);

// Verify user exists in database
try {
    $db = Database::getInstance();
    $check_query = "SELECT uid FROM users WHERE uid = ?";
    $check_stmt = $db->prepareAndExecute($check_query, "i", [$user_id]);
    if ($check_stmt) {
        $result = $check_stmt->get_result();
        if ($result->num_rows === 0) {
            error_log("WARNING: User ID " . $user_id . " not found in database!");
        } else {
            error_log("User ID " . $user_id . " verified in database");
        }
    }
} catch (Exception $e) {
    error_log("Error verifying user: " . $e->getMessage());
}

// Handle form submissions
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['update_profile'])) {
        // Handle profile update
        try {
            $db = Database::getInstance();
            $conn = $db->getConnection();
            
            $new_email = trim($_POST['email'] ?? '');
            $new_username = trim($_POST['username'] ?? '');
            $new_first_name = trim($_POST['first_name'] ?? '');
            $new_last_name = trim($_POST['last_name'] ?? '');
            $new_contact = trim($_POST['contact_number'] ?? '');
            
            $update_query = "UPDATE users SET email = ?, username = ?, first_name = ?, last_name = ?, contact_number = ? WHERE uid = ?";
            $stmt = $db->prepareAndExecute($update_query, "sssssi", [
                $new_email, $new_username, $new_first_name, $new_last_name, $new_contact, $user_id
            ]);
            
            if ($stmt) {
                // Update session variables
                $_SESSION['client_email'] = $new_email;
                $_SESSION['client_username'] = $new_username;
                $_SESSION['client_first_name'] = $new_first_name;
                $_SESSION['client_last_name'] = $new_last_name;
                $_SESSION['client_contact_number'] = $new_contact;

                // Log the activity
                $activity_type = 'profile_update';
                $activity_description = 'User updated their profile information';
                $ip_address = $_SERVER['REMOTE_ADDR'];
                $user_agent = $_SERVER['HTTP_USER_AGENT'];
                
                $log_query = "INSERT INTO user_activities (uid, activity_type, activity_description, ip_address, user_agent) 
                            VALUES (?, ?, ?, ?, ?)";
                $log_stmt = $db->prepareAndExecute($log_query, "issss", [
                    $user_id, $activity_type, $activity_description, $ip_address, $user_agent
                ]);
                
                $profile_success = "Profile updated successfully!";
            }
        } catch (Exception $e) {
            $profile_error = "An error occurred while updating your profile.";
            error_log("Profile Update Error: " . $e->getMessage());
        }
    } elseif (isset($_POST['change_password'])) {
        // Handle password change
        try {
            $db = Database::getInstance();
            $current_password = trim($_POST['current_password'] ?? '');
            $new_password = trim($_POST['new_password'] ?? '');
            $confirm_password = trim($_POST['confirm_password'] ?? '');
            
            // Only check if new passwords match
            if ($new_password !== $confirm_password) {
                $password_error = "New passwords do not match.";
            } else {
                // Verify current password
                $query = "SELECT password FROM users WHERE uid = ?";
                $stmt = $db->prepareAndExecute($query, "i", [$user_id]);
                if ($stmt) {
                    $result = $stmt->get_result();
                    if ($user = $result->fetch_assoc()) {
                        if (password_verify($current_password, $user['password'])) {
                            // Update password
                            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
                            $update_query = "UPDATE users SET password = ? WHERE uid = ?";
                            $update_stmt = $db->prepareAndExecute($update_query, "si", [$hashed_password, $user_id]);
                            
                            if ($update_stmt) {
                                // Log the activity
                                $activity_type = 'password_change';
                                $activity_description = 'User changed their password';
                                $ip_address = $_SERVER['REMOTE_ADDR'];
                                $user_agent = $_SERVER['HTTP_USER_AGENT'];
                                
                                $log_query = "INSERT INTO user_activities (uid, activity_type, activity_description, ip_address, user_agent) 
                                            VALUES (?, ?, ?, ?, ?)";
                                $log_stmt = $db->prepareAndExecute($log_query, "issss", [
                                    $user_id, $activity_type, $activity_description, $ip_address, $user_agent
                                ]);
                                
                                $password_success = "Password changed successfully!";
                                // Clear the password fields
                                $_POST['current_password'] = '';
                                $_POST['new_password'] = '';
                                $_POST['confirm_password'] = '';
                            }
                        } else {
                            $password_error = "Current password is incorrect.";
                        }
                    }
                }
            }
        } catch (Exception $e) {
            $password_error = "An error occurred while changing your password.";
            error_log("Password Change Error: " . $e->getMessage());
        }
    } elseif (isset($_POST['update_avatar'])) {
        // Handle avatar upload
        try {
            error_log("Avatar upload process started");
            $db = Database::getInstance();
            
            if (isset($_FILES['avatar'])) {
                error_log("Files array contents: " . print_r($_FILES['avatar'], true));
                
                if ($_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
                    $file = $_FILES['avatar'];
                    error_log("File upload successful, proceeding with processing");
                    
                    // Validate file type
                    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
                    error_log("File type: " . $file['type']);
                    
                    if (!in_array($file['type'], $allowed_types)) {
                        error_log("Invalid file type rejected: " . $file['type']);
                        $_SESSION['avatar_error'] = "Only JPG, PNG and GIF images are allowed.";
                    } else if ($file['size'] > 5 * 1024 * 1024) {
                        error_log("File too large: " . $file['size'] . " bytes");
                        $_SESSION['avatar_error'] = "File size must be less than 5MB.";
                    } else {
                        // Read file content
                        error_log("Reading file contents from: " . $file['tmp_name']);
                        $image_data = file_get_contents($file['tmp_name']);
                        
                        if ($image_data === false) {
                            error_log("Failed to read file contents from " . $file['tmp_name']);
                            $_SESSION['avatar_error'] = "Failed to read image file.";
                        } else {
                            error_log("Successfully read " . strlen($image_data) . " bytes");
                            
                            // Update profile picture in database
                            try {
                                $conn = $db->getConnection();
                                
                                // First verify the user exists
                                $verify_query = "SELECT uid FROM users WHERE uid = ?";
                                $verify_stmt = $conn->prepare($verify_query);
                                $verify_stmt->bind_param("i", $user_id);
                                $verify_stmt->execute();
                                $verify_result = $verify_stmt->get_result();
                                
                                if ($verify_result->num_rows === 0) {
                                    error_log("User ID " . $user_id . " not found in database!");
                                    $_SESSION['avatar_error'] = "User not found in database.";
                                    return;
                                }
                                $verify_stmt->close();
                                
                                // Now try to update the profile picture
                                error_log("User verified, proceeding with update");
                                
                                // Prepare the update statement
                                $update_query = "UPDATE users SET profile_picture = ? WHERE uid = ?";
                                $stmt = $conn->prepare($update_query);
                                
                                if (!$stmt) {
                                    error_log("Failed to prepare statement: " . $conn->error);
                                    $_SESSION['avatar_error'] = "Failed to prepare database statement.";
                                    return;
                                }
                                
                                // Bind the parameters
                                if (!$stmt->bind_param("si", $image_data, $user_id)) {
                                    error_log("Failed to bind parameters: " . $stmt->error);
                                    $_SESSION['avatar_error'] = "Failed to bind parameters.";
                                    return;
                                }
                                
                                // Execute the update
                                $success = $stmt->execute();
                                error_log("Execute result: " . ($success ? "true" : "false"));
                                
                                if ($success) {
                                    error_log("Statement executed successfully");
                                    error_log("Affected rows: " . $stmt->affected_rows);
                                    
                                    if ($stmt->affected_rows > 0) {
                                        error_log("Database updated successfully");
                                        
                                        // Verify the update
                                        $verify_update = $conn->query("SELECT LENGTH(profile_picture) as pic_size FROM users WHERE uid = " . $user_id);
                                        if ($verify_update) {
                                            $row = $verify_update->fetch_assoc();
                                            error_log("Verified image size in database: " . $row['pic_size'] . " bytes");
                                        }
                                        
                                        // Log the activity
                                        $activity_type = 'avatar_update';
                                        $activity_description = 'User updated their profile picture';
                                        $ip_address = $_SERVER['REMOTE_ADDR'];
                                        $user_agent = $_SERVER['HTTP_USER_AGENT'];
                                        
                                        $log_query = "INSERT INTO user_activities (uid, activity_type, activity_description, ip_address, user_agent) 
                                                    VALUES (?, ?, ?, ?, ?)";
                                        $log_stmt = $db->prepareAndExecute($log_query, "issss", [
                                            $user_id, $activity_type, $activity_description, $ip_address, $user_agent
                                        ]);
                                        
                                        $_SESSION['avatar_success'] = "Profile picture updated successfully!";
                                    } else {
                                        error_log("No rows affected. User ID: " . $user_id);
                                        error_log("Last MySQL error: " . $stmt->error);
                                        $_SESSION['avatar_error'] = "Failed to update profile picture (no changes made).";
                                    }
                                } else {
                                    error_log("Statement execution failed");
                                    error_log("MySQL error: " . $stmt->error);
                                    $_SESSION['avatar_error'] = "Database update failed: " . $stmt->error;
                                }
                                
                                $stmt->close();
                            } catch (Exception $e) {
                                error_log("Database error: " . $e->getMessage());
                                error_log("Stack trace: " . $e->getTraceAsString());
                                $_SESSION['avatar_error'] = "Database error occurred: " . $e->getMessage();
                            }
                        }
                    }
                } else {
                    $upload_errors = [
                        UPLOAD_ERR_INI_SIZE => "File exceeds PHP maximum file size",
                        UPLOAD_ERR_FORM_SIZE => "File exceeds form maximum file size",
                        UPLOAD_ERR_PARTIAL => "File was only partially uploaded",
                        UPLOAD_ERR_NO_FILE => "No file was uploaded",
                        UPLOAD_ERR_NO_TMP_DIR => "Missing temporary folder",
                        UPLOAD_ERR_CANT_WRITE => "Failed to write file to disk",
                        UPLOAD_ERR_EXTENSION => "A PHP extension stopped the file upload"
                    ];
                    $error_message = $upload_errors[$_FILES['avatar']['error']] ?? 'Unknown upload error';
                    error_log("Upload error: " . $error_message);
                    $_SESSION['avatar_error'] = "Upload failed: " . $error_message;
                }
            } else {
                error_log("No file uploaded - FILES array is empty for 'avatar'");
                $_SESSION['avatar_error'] = "Please select a valid image file.";
            }
        } catch (Exception $e) {
            error_log("Critical error in avatar upload: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            $_SESSION['avatar_error'] = "An error occurred while updating your profile picture.";
        }
        
        // Redirect to prevent form resubmission
        header("Location: " . $_SERVER['PHP_SELF'] . "?tab=settings&subtab=avatarChange");
        exit();
    }
}

// Fetch user activities for the activity feed
$activities = [];
try {
    $db = Database::getInstance();
    $activity_query = "SELECT activity_id, created_at, activity_type FROM user_activities WHERE uid = ? ORDER BY created_at DESC LIMIT 20";
    $stmt = $db->prepareAndExecute($activity_query, "i", [$user_id]);
    if ($stmt) {
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $activities[] = $row;
        }
        $stmt->close();
    }
} catch (Exception $e) {
    error_log("Activity Feed Error: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ACCOUNT SETTINGS</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <style>
    /* Menu button styles */
    .menu {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 20px;
    }

    .menu button {
        background: #0f3f41;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 6px;
        cursor: pointer;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background-color 0.3s;
        width: 100%;
    }

    .menu button i {
        width: 20px;
        text-align: center;
    }

    .menu button:hover {
        background: #0a2b2c;
    }

    .menu button.active {
        background: #FFD700;
        color: #0f3f41;
        font-weight: bold;
    }

    /* Keep existing tab visibility styles */
    .tab-content {
        display: none;
    }

    .tab-content.active {
        display: block;
    }

    .sub-tab {
        display: none;
    }

    .sub-tab.active {
        display: block;
    }

    .hidden {
        display: none !important;
    }

    /* Keep existing tabs container styles */
    .tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
    }

     .tabs button {
      padding: 10px 15px;
      border: none;
      cursor: pointer;
      background: #0f3f41;
      border-radius: 4px;
      color: white;
    }

    .tabs button.active {
      background: #e6c200;
      color: #0f3f41;
    }

    .tabs button:hover {
         background: #e6c200;
      color: #0f3f41;
    }

    .container {
        display: flex;
    }

    .wrapper {
        width: 100%;
        height: 100%;
    }

    .container {
        display: flex;
        width: 100%;
        min-height: 600px;
        box-sizing: border-box;
    }
    .sidebar {
        width: 220px;
        flex-shrink: 0;
        background: #0f3f41;
        min-height: 100%;
    }
    .content {
        flex: 1;
        background: #fff;
        min-width: 0;
        min-height: 100%;
        margin-left: 0;
        box-sizing: border-box;
    }

    /* Activity Feed Table Styles */
    .activity-table-container {
        max-height: 400px;
        overflow-y: auto;
        margin: 20px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .activity-table-container table {
        width: 100%;
        border-collapse: collapse;
    }

    .activity-table-container thead {
        position: sticky;
        top: 0;
        background: #0f3f41;
        color: white;
        z-index: 1;
    }

    .activity-table-container th,
    .activity-table-container td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }

    .activity-table-container tbody tr:hover {
        background-color: #f5f5f5;
    }

    .activity-table-container thead th {
        border-bottom: 2px solid #ddd;
    }
    </style>
</head>
<body class="user-settings-bg">
    <div class="upperbar">
        <div class="topbar">
            <span>[📞 0973 727 8473]</span>
            <span><a href="mailto:pcvcarillolaw@gmail.com" class="email-link">[ <i class="fas fa-envelope"></i> pcvcarillolaw@gmail.com]</a></span>
        </div>
        <nav class="navbar">
            <div class="logo">
                <a href = "index.php"><img src="src/web_logo-removebg-preview.png" alt="Carillo Law Office"></a>
                <span><a href = "index.php" class = "webname">CARILLO LAW</a></span>
            </div>

            <ul class="nav-links">
                <li><a href="index.php">HOME</a></li>
                <li><a href="#">ABOUT</a></li>
                <li><a href="services.php">SERVICES</a></li>
                <li><a href="#">CONTACTS</a></li>
                <li><a href="#">TESTIMONIALS</a></li>
                <li><a href="#">APPOINTMENTS</a></li>
                <li>
                    <div class="user-dropdown">
                        <a href="profile.php" class="user-nav" style="color:#FFD700; font-weight:bold; display:flex; align-items:center; gap:6px; text-decoration:none; text-transform:none;">
                            <i class="fas fa-user-circle" style="font-size: 20px;"></i>
                            <?= htmlspecialchars($_SESSION['client_first_name']) ?>
                        </a>
                        <div class="user-dropdown-content">
                            <a href="account-settings.php" class="dropdown-btn"><i class="fas fa-cog"></i> Settings</a>
                            <a href="logout.php" class="dropdown-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
                        </div>
                    </div>
                </li>
            </ul>
        </nav>
    </div>
     <div class="wrapper">
    <div class="container">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="avatar" id="userAvatar">
          <?php
          // Fetch current profile picture for sidebar
          $db = Database::getInstance();
          $query = "SELECT profile_picture FROM users WHERE uid = ?";
          $stmt = $db->prepareAndExecute($query, "i", [$user_id]);
          if ($stmt) {
              $result = $stmt->get_result();
              if ($row = $result->fetch_assoc()) {
                  if (!empty($row['profile_picture'])) {
                      echo '<img src="data:image/jpeg;base64,' . base64_encode($row['profile_picture']) . '" alt="User Image" style="width: 100%; height: 100%; object-fit: cover;">';
                  } else {
                      echo '<i class="fa-solid fa-user" style="font-size:48px; color:white"></i>';
                  }
              }
          }
          ?>
        </div>
        <div class="user-name" id="userName"><?= htmlspecialchars($first_name . ' ' . $last_name) ?></div>
        <div class="menu">
            <button onclick="showTab('overview', this)" class="active">
            <i class="fas fa-chart-line"></i> Overview
            </button>

            <button onclick="showTab('settings', this)">
            <i class="fas fa-user-cog"></i> Account Settings
            </button>

            <button onclick="showTab('help', this)">
            <i class="fas fa-circle-question"></i> Help
            </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content">
        <!-- Overview -->
        <div id="overview" class="tab-content">
          <h2>Activity Feed</h2>
          <div class="activity-table-container">
            <table>
              <thead>
                <tr>
                  <th>Transaction #</th>
                  <th>Date/Time</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                <?php if (!empty($activities)): ?>
                  <?php foreach ($activities as $activity): ?>
                    <tr>
                      <td><?= htmlspecialchars($activity['activity_id']) ?></td>
                      <td><?= htmlspecialchars($activity['created_at']) ?></td>
                      <td><?= htmlspecialchars($activity['activity_type']) ?></td>
                    </tr>
                  <?php endforeach; ?>
                <?php else: ?>
                  <tr><td colspan="3">No activities found.</td></tr>
                <?php endif; ?>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Account Settings -->
        <div id="settings" class="tab-content hidden">
          <div class="tabs">
            <button onclick="showSubTab('accountInfo', this)" class="active">User Account Info</button>
            <button onclick="showSubTab('avatarChange', this)">Change Avatar</button>
            <button onclick="showSubTab('passwordChange', this)">Change Password</button>
          </div>

          <!-- User Account Info -->
          <div id="accountInfo" class="sub-tab active">
            <form method="post" action="">
                <div class="form-row">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value="<?= htmlspecialchars($email) ?>">
                    </div>
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" name="username" value="<?= htmlspecialchars($username) ?>">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" name="first_name" value="<?= htmlspecialchars($first_name) ?>">
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" name="last_name" value="<?= htmlspecialchars($last_name) ?>">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Mobile Number</label>
                        <input type="tel" name="contact_number" value="<?= htmlspecialchars((string)$mobile_number) ?>">
                    </div>
                </div>
                <?php if (isset($profile_success)): ?>
                    <div class="success-message"><?= htmlspecialchars($profile_success) ?></div>
                <?php endif; ?>
                <?php if (isset($profile_error)): ?>
                    <div class="error-message"><?= htmlspecialchars($profile_error) ?></div>
                <?php endif; ?>
                <div class="form-actions">
                    <button type="submit" name="update_profile" class="change-pass">Save Changes</button>
                </div>
            </form>
        </div>

          <!-- Change Avatar -->
          <div id="avatarChange" class="sub-tab hidden">
            <form method="post" action="" enctype="multipart/form-data" id="avatarForm">
                <!-- Image Preview -->
                <div class="avatar-preview">
                    <?php
                    // Fetch current profile picture
                    $db = Database::getInstance();
                    $query = "SELECT profile_picture FROM users WHERE uid = ?";
                    $stmt = $db->prepareAndExecute($query, "i", [$user_id]);
                    if ($stmt) {
                        $result = $stmt->get_result();
                        if ($row = $result->fetch_assoc()) {
                            if (!empty($row['profile_picture'])) {
                                echo '<img id="avatarPreviewImg" src="data:image/jpeg;base64,' . base64_encode($row['profile_picture']) . '" alt="Avatar Preview">';
                            } else {
                                echo '<i class="fa-solid fa-user" style="font-size:48px; color:#999"></i>';
                            }
                        }
                    }
                    ?>
                </div>

                <!-- Upload Input -->
                <div class="form-group">
                    <label>Select New Profile Picture</label>
                    <input type="file" id="avatarInput" name="avatar" accept="image/jpeg,image/png,image/gif" required>
                    <small>Max file size: 5MB. Allowed formats: JPG, PNG, GIF</small>
                </div>
                <?php if (isset($avatar_success)): ?>
                    <div class="success-message"><?= htmlspecialchars($avatar_success) ?></div>
                <?php endif; ?>
                <?php if (isset($avatar_error)): ?>
                    <div class="error-message"><?= htmlspecialchars($avatar_error) ?></div>
                <?php endif; ?>
                <!-- Buttons below everything -->
                <div class="form-actions">
                    <button type="submit" name="update_avatar" class="change-pass">Update Profile Picture</button>
                    <button type="button" onclick="resetAvatar()">Cancel</button>
                </div>
            </form>
        </div>

          <!-- Change Password -->
          <div id="passwordChange" class="sub-tab hidden">
            <form method="post" action="">
                <div class="form-group">
                    <label>Current Password</label>
                    <div class="password-wrapper">
                        <input type="password" name="current_password" placeholder="Current Password" id="currentPassword" required />
                        <img src="https://cdn-icons-png.flaticon.com/512/565/565655.png" alt="Show" id="toggleCurrentPassword" />
                    </div>
                </div>
                <div class="form-group">
                    <label>New Password</label>
                    <div class="password-wrapper">
                        <input type="password" name="new_password" placeholder="New Password" id="newPassword" required />
                        <img src="https://cdn-icons-png.flaticon.com/512/565/565655.png" alt="Show" id="toggleNewPassword" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <div class="password-wrapper">
                        <input type="password" name="confirm_password" placeholder="Confirm New Password" id="confirmNewPassword" required />
                        <img src="https://cdn-icons-png.flaticon.com/512/565/565655.png" alt="Show" id="toggleConfirmPassword" />
                    </div>
                </div>
                <?php if (isset($password_success)): ?>
                    <div class="success-message"><?= htmlspecialchars($password_success) ?></div>
                <?php endif; ?>
                <?php if (isset($password_error)): ?>
                    <div class="error-message"><?= htmlspecialchars($password_error) ?></div>
                <?php endif; ?>
                <div class="form-actions">
                    <button type="submit" name="change_password" class="change-pass">Change Password</button>
                    <button type="button" onclick="clearPasswordFields()">Cancel</button>
                </div>
            </form>
          </div>
        </div>

        <!-- Help -->
            <div id="help" class="tab-content hidden">
            <h2 class="help-head" >FAQs</h2>
                <div class="faq-accordion">
                    <div class="faq-item">
                    <button class="faq-question" data-target="faq1"><span class="number">1.</span> How do I change my password?</button>
                    <div id="faq1" class="faq-answer">
                        <p><strong>A:</strong> Go to Account Settings → Change Password.</p>
                    </div>
                    </div>
                    <div class="faq-item">
                    <button class="faq-question" data-target="faq2"><span class="number">2.</span> How do I update my profile picture?</button>
                    <div id="faq2" class="faq-answer">
                        <p><strong>A:</strong> Go to Account Settings → Change Avatar.</p>
                    </div>
                    </div>
                    <div class="faq-item">
                    <button class="faq-question" data-target="faq3"><span class="number">3.</span> How can I contact support?</button>
                    <div id="faq3" class="faq-answer">
                        <p><strong>A:</strong> Email support@example.com.</p>
                    </div>
                    </div>
                </div>
            </div>
       </div>
    </div>
  </div>
    <footer class="footer">
        <div class="footer-container">
            <div class="footer-section about">
                <h3>Carillo Law Office</h3>
                <p>Providing trusted legal and notarial services in civil, real estate, and contract law for over 5 years.</p>
            </div>
            <div class="footer-section contact">
                <h4>Contact Us</h4>
                <p>📍 9017 C.P. Trinidad St., Concepcion, Baliuag, Philippines</p>
                <p>📞 0973 727 8473</p>
                <p><a href="mailto:pcvcarillolaw@gmail.com" class="email-link"><i class="fas fa-envelope"></i> pcvcarillolaw@gmail.com</a></p>
                <p>
                    <a href="https://www.facebook.com/profile.php?id=100083055586233" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="facebook-link">
                        <i class="fab fa-facebook-square" style = " margin-right: 5px;"></i>  Facebook
                    </a>
                </p>
            </div>
            <div class="footer-section hours">
                <h4>Office Hours</h4>
                <p>Mon – Fri: 9:00 AM – 6:00 PM</p>
                <p>Sat: 8:00 AM – 5:00 PM</p>
                <p>Sun & Holidays: Closed</p>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2025 Carillo Law Office. All rights reserved.</p>
            <p>All legal services comply with Philippine law. This website is for informational purposes only and does not constitute legal advice.</p>
        </div>
    </footer>
  <script>
    // Function to show main tabs (Overview, Settings, Help)
    function showTab(tabId, el) {
        console.log('Showing tab:', tabId); // Debug log
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.remove('hidden');
            selectedTab.classList.add('active');
            console.log('Tab shown:', tabId); // Debug log
        }

        // Update active state of menu buttons
        document.querySelectorAll('.menu button').forEach(btn => {
            btn.classList.remove('active');
        });
        el.classList.add('active');

        // If switching to settings tab, show the first sub-tab by default
        if (tabId === 'settings') {
            const firstSubTab = document.querySelector('.tabs button');
            if (firstSubTab) {
                showSubTab('accountInfo', firstSubTab);
            }
        }
    }

    // Function to show sub-tabs (Account Info, Change Avatar, Change Password)
    function showSubTab(subId, el) {
        console.log('Showing sub-tab:', subId); // Debug log
        
        // Hide all sub-tab contents
        document.querySelectorAll('.sub-tab').forEach(subTab => {
            subTab.classList.add('hidden');
            subTab.classList.remove('active');
        });
        
        // Show selected sub-tab content
        const selectedSubTab = document.getElementById(subId);
        if (selectedSubTab) {
            selectedSubTab.classList.remove('hidden');
            selectedSubTab.classList.add('active');
            console.log('Sub-tab shown:', subId); // Debug log
        }

        // Update active state of sub-tab buttons
        document.querySelectorAll('.tabs button').forEach(btn => {
            btn.classList.remove('active');
        });
        el.classList.add('active');
    }

    // Function to clear password fields
    function clearPasswordFields() {
        const inputs = document.querySelectorAll('#passwordChange input[type="password"]');
        inputs.forEach(input => input.value = '');
    }

    // Function to reset avatar input
    function resetAvatar() {
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) {
            avatarInput.value = '';
            // Reload the page to show the current avatar
            location.reload();
        }
    }

    // Setup password toggle functionality
    function setupToggle(toggleId, inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);

        if (toggle && input) {
            toggle.addEventListener("click", function () {
                const isPassword = input.getAttribute("type") === "password";
                input.setAttribute("type", isPassword ? "text" : "password");
                toggle.src = isPassword
                    ? "https://cdn-icons-png.flaticon.com/512/159/159604.png" 
                    : "https://cdn-icons-png.flaticon.com/512/565/565655.png";
            });
        }
    }

    // Setup FAQ accordion functionality
    function setupFAQAccordion() {
        const faqButtons = document.querySelectorAll('.faq-question');
        const allAnswers = document.querySelectorAll('.faq-answer');

        faqButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                const targetAnswer = document.getElementById(targetId);

                // Close all other answers
                allAnswers.forEach(answer => {
                    if (answer !== targetAnswer) {
                        answer.classList.remove('active');
                    }
                });

                // Toggle current answer
                if (targetAnswer) {
                    targetAnswer.classList.toggle('active');
                }
            });
        });
    }

    // Initialize all functionality when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Page loaded, initializing...'); // Debug log
        
        // Setup password toggles
        setupToggle("toggleCurrentPassword", "currentPassword");
        setupToggle("toggleNewPassword", "newPassword");
        setupToggle("toggleConfirmPassword", "confirmNewPassword");

        // Setup FAQ accordion
        setupFAQAccordion();

        // Show the first tab by default (Overview)
        const firstTab = document.querySelector('.menu button');
        if (firstTab) {
            showTab('overview', firstTab);
        }

        // Add click event listeners to all menu buttons
        document.querySelectorAll('.menu button').forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('onclick').split("'")[1];
                showTab(tabId, this);
            });
        });

        // Add click event listeners to all sub-tab buttons
        document.querySelectorAll('.tabs button').forEach(button => {
            button.addEventListener('click', function() {
                const subTabId = this.getAttribute('onclick').split("'")[1];
                showSubTab(subTabId, this);
            });
        });

        // Setup avatar preview and form submission
        const avatarForm = document.getElementById('avatarForm');
        const avatarInput = document.getElementById('avatarInput');
        const avatarPreview = document.getElementById('avatarPreviewImg');
        
        if (avatarForm && avatarInput && avatarPreview) {
            // Handle form submission
            avatarForm.addEventListener('submit', function(e) {
                if (!avatarInput.files || !avatarInput.files[0]) {
                    e.preventDefault();
                    alert('Please select an image file first.');
                    return;
                }
                
                const file = avatarInput.files[0];
                // Validate file size
                if (file.size > 5 * 1024 * 1024) {
                    e.preventDefault();
                    alert('File size must be less than 5MB');
                    return;
                }
                
                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    e.preventDefault();
                    alert('Only JPG, PNG and GIF images are allowed');
                    return;
                }
            });

            // Handle file selection
            avatarInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    // Validate file size
                    if (file.size > 5 * 1024 * 1024) {
                        alert('File size must be less than 5MB');
                        this.value = '';
                        return;
                    }
                    
                    // Validate file type
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                    if (!allowedTypes.includes(file.type)) {
                        alert('Only JPG, PNG and GIF images are allowed');
                        this.value = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function(e) {
                        avatarPreview.src = e.target.result;
                        avatarPreview.style.display = 'block';
                        // Also update the sidebar avatar
                        const sidebarAvatar = document.querySelector('.sidebar .avatar img');
                        if (sidebarAvatar) {
                            sidebarAvatar.src = e.target.result;
                        } else {
                            const sidebarAvatarDiv = document.querySelector('.sidebar .avatar');
                            sidebarAvatarDiv.innerHTML = `<img src="${e.target.result}" alt="User Image">`;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });
  </script>
</body>
</html>
