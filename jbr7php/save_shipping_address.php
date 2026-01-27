<?php
// save_shipping_address.php
// Saves or updates a shipping address for the authenticated user

session_start();
header('Content-Type: application/json; charset=utf-8');

$DB_HOST = '127.0.0.1';
$DB_NAME = 'jbr7_db';
$DB_USER = 'root';
$DB_PASS = '';

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

$userId = (int)$_SESSION['user_id'];

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

// Validate required fields
$addressType = isset($input['address_type']) ? $input['address_type'] : 'home';
if (!in_array($addressType, ['home', 'office'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid address type']);
    exit;
}

try {
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    $addressId = isset($input['id']) ? (int)$input['id'] : null;
    $isDefault = isset($input['is_default']) && $input['is_default'] ? 1 : 0;
    
    // If setting as default, unset other defaults for this user
    if ($isDefault) {
        $unsetDefaultStmt = $pdo->prepare('UPDATE shipping_addresses SET is_default = 0 WHERE user_id = :user_id');
        $unsetDefaultStmt->execute([':user_id' => $userId]);
    }
    
    if ($addressId) {
        // Update existing address
        // Verify ownership
        $checkStmt = $pdo->prepare('SELECT id FROM shipping_addresses WHERE id = :id AND user_id = :user_id LIMIT 1');
        $checkStmt->execute([':id' => $addressId, ':user_id' => $userId]);
        if (!$checkStmt->fetch()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Address not found or access denied']);
            exit;
        }
        
        $updateStmt = $pdo->prepare('
            UPDATE shipping_addresses SET
                address_type = :address_type,
                is_default = :is_default,
                first_name = :first_name,
                middle_name = :middle_name,
                last_name = :last_name,
                recipient_name = :recipient_name,
                company_name = :company_name,
                mobile_number = :mobile_number,
                alternate_number = :alternate_number,
                office_phone = :office_phone,
                email_address = :email_address,
                house_unit_number = :house_unit_number,
                building_name = :building_name,
                floor_unit_number = :floor_unit_number,
                street_name = :street_name,
                subdivision_village = :subdivision_village,
                barangay = :barangay,
                city_municipality = :city_municipality,
                province_state = :province_state,
                postal_zip_code = :postal_zip_code,
                country = :country,
                landmark_delivery_notes = :landmark_delivery_notes,
                office_hours = :office_hours,
                additional_instructions = :additional_instructions,
                latitude = :latitude,
                longitude = :longitude,
                formatted_address = :formatted_address
            WHERE id = :id AND user_id = :user_id
        ');
        
        $updateStmt->execute([
            ':id' => $addressId,
            ':user_id' => $userId,
            ':address_type' => $addressType,
            ':is_default' => $isDefault,
            ':first_name' => $input['first_name'] ?? null,
            ':middle_name' => $input['middle_name'] ?? null,
            ':last_name' => $input['last_name'] ?? null,
            ':recipient_name' => $input['recipient_name'] ?? null,
            ':company_name' => $input['company_name'] ?? null,
            ':mobile_number' => $input['mobile_number'] ?? null,
            ':alternate_number' => $input['alternate_number'] ?? null,
            ':office_phone' => $input['office_phone'] ?? null,
            ':email_address' => $input['email_address'] ?? null,
            ':house_unit_number' => $input['house_unit_number'] ?? null,
            ':building_name' => $input['building_name'] ?? null,
            ':floor_unit_number' => $input['floor_unit_number'] ?? null,
            ':street_name' => $input['street_name'] ?? null,
            ':subdivision_village' => $input['subdivision_village'] ?? null,
            ':barangay' => $input['barangay'] ?? null,
            ':city_municipality' => $input['city_municipality'] ?? null,
            ':province_state' => $input['province_state'] ?? null,
            ':postal_zip_code' => $input['postal_zip_code'] ?? null,
            ':country' => $input['country'] ?? 'Philippines',
            ':landmark_delivery_notes' => $input['landmark_delivery_notes'] ?? null,
            ':office_hours' => $input['office_hours'] ?? null,
            ':additional_instructions' => $input['additional_instructions'] ?? null,
            ':latitude' => isset($input['latitude']) ? (float)$input['latitude'] : null,
            ':longitude' => isset($input['longitude']) ? (float)$input['longitude'] : null,
            ':formatted_address' => $input['formatted_address'] ?? null
        ]);
        
        $message = 'Address updated successfully';
    } else {
        // Insert new address
        $insertStmt = $pdo->prepare('
            INSERT INTO shipping_addresses (
                user_id, address_type, is_default,
                first_name, middle_name, last_name, recipient_name, company_name,
                mobile_number, alternate_number, office_phone, email_address,
                house_unit_number, building_name, floor_unit_number, street_name,
                subdivision_village, barangay, city_municipality, province_state,
                postal_zip_code, country, landmark_delivery_notes, office_hours,
                additional_instructions, latitude, longitude, formatted_address
            ) VALUES (
                :user_id, :address_type, :is_default,
                :first_name, :middle_name, :last_name, :recipient_name, :company_name,
                :mobile_number, :alternate_number, :office_phone, :email_address,
                :house_unit_number, :building_name, :floor_unit_number, :street_name,
                :subdivision_village, :barangay, :city_municipality, :province_state,
                :postal_zip_code, :country, :landmark_delivery_notes, :office_hours,
                :additional_instructions, :latitude, :longitude, :formatted_address
            )
        ');
        
        $insertStmt->execute([
            ':user_id' => $userId,
            ':address_type' => $addressType,
            ':is_default' => $isDefault,
            ':first_name' => $input['first_name'] ?? null,
            ':middle_name' => $input['middle_name'] ?? null,
            ':last_name' => $input['last_name'] ?? null,
            ':recipient_name' => $input['recipient_name'] ?? null,
            ':company_name' => $input['company_name'] ?? null,
            ':mobile_number' => $input['mobile_number'] ?? null,
            ':alternate_number' => $input['alternate_number'] ?? null,
            ':office_phone' => $input['office_phone'] ?? null,
            ':email_address' => $input['email_address'] ?? null,
            ':house_unit_number' => $input['house_unit_number'] ?? null,
            ':building_name' => $input['building_name'] ?? null,
            ':floor_unit_number' => $input['floor_unit_number'] ?? null,
            ':street_name' => $input['street_name'] ?? null,
            ':subdivision_village' => $input['subdivision_village'] ?? null,
            ':barangay' => $input['barangay'] ?? null,
            ':city_municipality' => $input['city_municipality'] ?? null,
            ':province_state' => $input['province_state'] ?? null,
            ':postal_zip_code' => $input['postal_zip_code'] ?? null,
            ':country' => $input['country'] ?? 'Philippines',
            ':landmark_delivery_notes' => $input['landmark_delivery_notes'] ?? null,
            ':office_hours' => $input['office_hours'] ?? null,
            ':additional_instructions' => $input['additional_instructions'] ?? null,
            ':latitude' => isset($input['latitude']) ? (float)$input['latitude'] : null,
            ':longitude' => isset($input['longitude']) ? (float)$input['longitude'] : null,
            ':formatted_address' => $input['formatted_address'] ?? null
        ]);
        
        $addressId = $pdo->lastInsertId();
        $message = 'Address added successfully';
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'address_id' => $addressId
    ]);
    
} catch (Exception $e) {
    error_log('save_shipping_address.php - Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save address']);
}
