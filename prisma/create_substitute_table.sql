CREATE TABLE IF NOT EXISTS substitute_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  absentStaffId INT NOT NULL,
  substituteStaffId INT NOT NULL,
  classEnrolled VARCHAR(191) NOT NULL,
  assignedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_absent_staff (absentStaffId),
  INDEX idx_substitute_staff (substituteStaffId),
  INDEX idx_class (classEnrolled),
  FOREIGN KEY (absentStaffId) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (substituteStaffId) REFERENCES staff(id) ON DELETE CASCADE
);
