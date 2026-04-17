-- Stylist availability settings
CREATE TABLE IF NOT EXISTS stylist_availability (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  stylist_id      INT NOT NULL UNIQUE,
  is_available    TINYINT(1) NOT NULL DEFAULT 1,
  work_days       VARCHAR(50) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
  start_hour      INT NOT NULL DEFAULT 9,
  end_hour        INT NOT NULL DEFAULT 18,
  blocked_dates   TEXT DEFAULT NULL,  -- JSON array of "YYYY-MM-DD" strings
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE
);
