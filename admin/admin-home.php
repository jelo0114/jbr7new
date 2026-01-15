<?php
session_start();
require_once '../config/database.php';

if (!isset($_SESSION['admin_logged_in'])) {
    header("Location: login.php");
    exit();
}

if (isset($_GET['logout']) && $_GET['logout'] === 'true') {
    session_unset();
    session_destroy();
    header("Location: login.php");
    exit();
}

$db = Database::getInstance();
$conn = $db->getConnection();

$query = "SELECT COUNT(*) as pending_count FROM consultations WHERE status = 'pending'";
$result = $conn->query($query);
$row = $result->fetch_assoc();
$pending_count = $row['pending_count'];

$query = "SELECT full_name, preferred_date FROM consultations WHERE status = 'pending' ORDER BY created_at DESC LIMIT 3";
$result = $conn->query($query);
$latest_consults = $result->fetch_all(MYSQLI_ASSOC);

// Get current or requested month/year
$month = isset($_GET['month']) ? (int)$_GET['month'] : date('m');
$year = isset($_GET['year']) ? (int)$_GET['year'] : date('Y');

// Get consultation dates for the calendar highlight
$stmt = $conn->prepare("SELECT preferred_date, full_name FROM consultations WHERE MONTH(preferred_date) = ? AND YEAR(preferred_date) = ?");
$stmt->bind_param("ii", $month, $year);
$stmt->execute();
$result = $stmt->get_result();

$consultations_by_date = []; // key: date string, value: array of client names
while ($row = $result->fetch_assoc()) {
    $date = substr($row['preferred_date'], 0, 10); // Only the date part "YYYY-MM-DD"
    if (!isset($consultations_by_date[$date])) {
        $consultations_by_date[$date] = [];
    }
    $datetime = new DateTime($row['preferred_date']);
    $time = $datetime->format('H:i'); // format as 24-hour time

    $consultations_by_date[$date][] = [
        'name' => $row['full_name'],
        'time' => $time
    ];
}

// Change function signature to accept consultations_by_date instead of consultation_dates
function build_calendar($month, $year, $consultations_by_date = []) {
    $daysOfWeek = array('Sun','Mon','Tue','Wed','Thu','Fri','Sat');
    $firstDayOfMonth = mktime(0,0,0,$month,1,$year);
    $numberDays = date('t',$firstDayOfMonth);
    $dateComponents = getdate($firstDayOfMonth);
    $monthName = $dateComponents['month'];
    $dayOfWeek = $dateComponents['wday'];

    $calendar = "<table class='calendar'>";
    $calendar .= "<caption>$monthName $year</caption>";
    $calendar .= "<tr>";

    foreach($daysOfWeek as $day) {
        $calendar .= "<th class='header'>$day</th>";
    }

    $calendar .= "</tr><tr>";

    if ($dayOfWeek > 0) { 
        $calendar .= str_repeat("<td></td>", $dayOfWeek); 
    }

    $currentDay = 1;

    while ($currentDay <= $numberDays) {
        if ($dayOfWeek == 7) {
            $dayOfWeek = 0;
            $calendar .= "</tr><tr>";
        }

        $dateString = sprintf('%04d-%02d-%02d', $year, $month, $currentDay);

        $highlight_class = '';
        $client_names_html = '';

        if (isset($consultations_by_date[$dateString])) {
            $highlight_class = ' highlight';

            // Create a list of client names for this day
            $names = $consultations_by_date[$dateString];
            $client_names_html = '<br><small>';
            foreach ($names as $client) {
                $client_name = htmlspecialchars($client['name']);
                $client_time = htmlspecialchars($client['time']);
                $client_names_html .= "$client_name at $client_time<br>";
            }
        
        }

        $data_clients = isset($consultations_by_date[$dateString]) 
        ? htmlspecialchars(json_encode($consultations_by_date[$dateString])) 
        : '';

        $calendar .= "<td class='day{$highlight_class}' data-date='$dateString'" .
            ($data_clients ? " data-clients='$data_clients'" : "") .
            ">$currentDay</td>";


        $currentDay++;
        $dayOfWeek++;
    }

    if ($dayOfWeek != 7) { 
        $remainingDays = 7 - $dayOfWeek;
        $calendar .= str_repeat("<td></td>", $remainingDays); 
    }

    $calendar .= "</tr>";
    $calendar .= "</table>";

    return $calendar;
}
?>


?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="admin.css">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <div class="sidebar">
            <div class="logo">
                <img src="../src/web_logo-removebg-preview.png" alt="Carillo Law Office">
                <span>Carillo Law Admin</span>
            </div>
            <nav>
                <a href="#">Dashboard</a>
                <a href="appointments.html">Appointments</a>
                <a href="services.html">Services</a>
                <a href="testimonials.html">Testimonials</a>
                <a href="contact_info.html">Contact Info</a>
                <a href="?logout=true" class="logout-btn">Logout</a>
            </nav>
        </div>
    </header>

    <main>
        <div class="dashboard">
            <section class="welcome">
                <h1>Welcome!</h1>
                <p>Your dashboard overview.</p>
            </section>

            <section class="quick-stats">
                <div class="stat-card">
                    <h3>Pending Consultations</h3>
                    <p><?php echo $pending_count; ?></p>
                </div>
                <div class="stat-card">
                    <h3>Services Offered</h3>
                    <p>5</p>
                </div>
                <div class="stat-card">
                    <h3>Testimonials</h3>
                    <p>2</p>
                </div>
            </section>

            <section class="recent-activity">
                <h2>Recent Pending Consultations</h2>
                <ul>
                    <?php foreach ($latest_consults as $consult): ?>
                        <li><?php echo htmlspecialchars($consult['full_name']); ?> requested consultation on <?php echo htmlspecialchars($consult['preferred_date']); ?></li>
                    <?php endforeach; ?>
                </ul>
            </section>

            <div class="calendar-container">
                <?php
                $prevMonth = $month - 1;
                $prevYear = $year;
                if ($prevMonth < 1) {
                    $prevMonth = 12;
                    $prevYear--;
                }

                $nextMonth = $month + 1;
                $nextYear = $year;
                if ($nextMonth > 12) {
                    $nextMonth = 1;
                    $nextYear++;
                }

                echo "<div class='calendar-nav'>";
                echo "<a href='?month=$prevMonth&year=$prevYear'>&laquo; Previous</a>";
                echo "<a href='?month=$nextMonth&year=$nextYear'>Next &raquo;</a>";
                echo "</div>";

                echo build_calendar($month, $year, $consultations_by_date);
                ?>
            </div>

            <div id="client-modal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3>Scheduled Clients</h3>
                    <ul id="client-list"></ul>
                </div>
            </div>

            <section class="quick-actions">
                <h2>Quick Actions</h2>
                <div class="actions">
                    <a href="appointments.html" class="btn">Manage Appointments</a>
                    <a href="services.html" class="btn">Edit Services</a>
                    <a href="testimonials.html" class="btn">Moderate Testimonials</a>
                </div>
            </section>
        </div>
    </main>

<script>
    document.addEventListener("DOMContentLoaded", function () {
        const modal = document.getElementById("client-modal");
        const clientList = document.getElementById("client-list");
        const closeBtn = document.querySelector(".modal .close");

        document.querySelectorAll(".calendar td.highlight").forEach(cell => {
            cell.addEventListener("mouseenter", function () {
                const clients = JSON.parse(this.dataset.clients || "[]");
                clientList.innerHTML = "";
                clients.forEach(c => {
                    const li = document.createElement("li");
                    li.innerHTML = `<strong>${c.name}</strong> at <em>${c.time}</em>`;
                    clientList.appendChild(li);
                });

                const rect = this.getBoundingClientRect();
                modal.style.left = `${rect.left + window.scrollX + 20}px`;
                modal.style.top = `${rect.top + window.scrollY + 20}px`;
                modal.style.display = "block";
            });

            cell.addEventListener("mouseleave", function () {
                modal.style.display = "none";
            });
        });

        closeBtn.onclick = function () {
            modal.style.display = "none";
        };
    });
</script>


</body>
</html>
