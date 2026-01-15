<?php
/**
 * Database Connection Class
 * Handles database connections and provides reusable methods for database operations
 */
class Database {
    private static $instance = null;
    private $conn;
    
    // Database credentials
    private $host = 'localhost';
    private $db_name = 'carillolawdb';
    private $username = 'root';
    private $password = '';
    
    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct() {
        try {
            // Enable error reporting for mysqli
            mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
            
            // First try to connect without database
            $this->conn = new mysqli($this->host, $this->username, $this->password);
            
            if ($this->conn->connect_error) {
                throw new Exception("MySQL Connection Error: " . $this->conn->connect_error);
            }
            
            // Create database if it doesn't exist
            $sql = "CREATE DATABASE IF NOT EXISTS " . $this->db_name;
            if (!$this->conn->query($sql)) {
                throw new Exception("Error creating database: " . $this->conn->error);
            }
            
            // Select the database
            if (!$this->conn->select_db($this->db_name)) {
                throw new Exception("Error selecting database: " . $this->conn->error);
            }
            
            // Set charset to ensure proper encoding
            $this->conn->set_charset("utf8mb4");
            
            error_log("Database connection successful");
        } catch (Exception $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            error_log("Connection Details - Host: " . $this->host . ", Database: " . $this->db_name);
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    /**
     * Get database instance (Singleton pattern)
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get the database connection
     * @return mysqli
     */
    public function getConnection() {
        return $this->conn;
    }
    
    /**
     * Prepare and execute a query safely
     * @param string $query The SQL query with placeholders
     * @param string $types The types of parameters (i: integer, s: string, d: double, b: blob)
     * @param array $params The parameters to bind
     * @return mysqli_stmt|false
     */
    public function prepareAndExecute($query, $types = "", $params = []) {
        try {
            $stmt = $this->conn->prepare($query);
            
            if (!$stmt) {
                error_log("Query preparation failed: " . $this->conn->error);
                error_log("Query was: " . $query);
                throw new Exception("Query preparation failed: " . $this->conn->error);
            }
            
            if (!empty($params)) {
                // For binary data, we need to handle it specially
                if (strpos($types, 'b') !== false) {
                    $bind_params = array();
                    $bind_params[] = $types;
                    for ($i = 0; $i < count($params); $i++) {
                        $bind_params[] = &$params[$i];
                    }
                    call_user_func_array(array($stmt, 'bind_param'), $bind_params);
                } else {
                    $stmt->bind_param($types, ...$params);
                }
            }
            
            if (!$stmt->execute()) {
                error_log("Query execution failed: " . $stmt->error);
                return false;
            }
            
            return $stmt;
        } catch (Exception $e) {
            error_log("Query Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Close the database connection
     */
    public function closeConnection() {
        if ($this->conn) {
            $this->conn->close();
        }
    }
    
    /**
     * Prevent cloning of the instance
     */
    private function __clone() {}
    
    /**
     * Prevent unserializing of the instance
     * Must be public as per PHP requirements for magic methods
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Usage example:
/*
try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Example query
    $query = "SELECT * FROM admins WHERE username = ? AND password = ?";
    $stmt = $db->prepareAndExecute($query, "ss", [$username, $password]);
    
    if ($stmt) {
        $result = $stmt->get_result();
        // Process result...
        $stmt->close();
    }
    
} catch (Exception $e) {
    // Handle error
    echo "Error: " . $e->getMessage();
} finally {
    // Close connection when done
    if (isset($db)) {
        $db->closeConnection();
    }
}
*/ 