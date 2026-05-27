# Quick Testing Guide - 3 Conflicts

## Test Setup
- HOD logged in
- Current date: May 27, 2026
- Existing staff: Dr. Venkat Prasad (Class not assigned), Mr. Rajesh Kumar (Class 11), Mrs. Lakshmi Devi (Class 6)

---

## TEST CONFLICT 1: Duplicate Class on Approval

### Test Case 1.1: Approve New Teacher with Available Class
```
1. New teacher registers: "Aditya" with Class 5
2. HOD approves teacher ID 5
3. POST /api/hod/staff/5/approve { "assignedClass": "Class 5" }
4. Expected: ✅ Success, teacher approved and assigned to Class 5
```

### Test Case 1.2: Approve New Teacher with TAKEN Class (Conflict)
```
1. New teacher registers: "John" with Class 6
2. HOD approves teacher ID 6
3. POST /api/hod/staff/6/approve { "assignedClass": "Class 6" }
4. Expected: ❌ 409 Conflict with 3 resolution options
5. Response should include:
   - existingTeacherName: "Mrs. Lakshmi Devi"
   - availableClasses: ["Class 1", "Class 2", "Class 3", ...]
   - resolutionOptions with action: "swap_classes", "assign_alternative_class"
```

### Test Case 1.3: Resolve Conflict - Swap Classes
```
1. From Test 1.2, get the conflict response
2. Choose "Swap classes" with targetClass: "Class 2"
3. POST /api/hod/staff/6/approve {
     "assignedClass": "Class 6",
     "resolveConflict": {
       "action": "swap_classes",
       "targetClass": "Class 2"
     }
   }
4. Expected: ✅ Success
   - New teacher (ID 6) → Class 6
   - Mrs. Lakshmi Devi → Class 2
5. Verify: Check Staff Portal - both teachers show updated classes
```

### Test Case 1.4: Resolve Conflict - Assign Alternative
```
1. New teacher registers: "Sarah" with Class 6 (already taken)
2. HOD approves with alternative
3. POST /api/hod/staff/7/approve {
     "assignedClass": "Class 6",
     "resolveConflict": {
       "action": "assign_alternative_class",
       "targetClass": "Class 3"
     }
   }
4. Expected: ✅ Success, new teacher gets Class 3 instead
```

---

## TEST CONFLICT 2: Leave Approval & Timetable Coverage

### Prerequisites
- Mrs. Lakshmi Devi assigned to Class 6
- Class 6 has timetable entries for May 29 (P1, P2, P4, P5)
- Slots: P1 (09:00-09:45), P2 (09:45-10:30), P4 (11:15-12:00), P5 (12:00-12:45)

### Test Case 2.1: Approve Leave & Get Coverage Info
```
1. Mrs. Lakshmi Devi requests leave: May 29-31
2. HOD reviews and approves
3. PATCH /api/hod/staff-leave/10/approve { "status": "APPROVED" }
4. Expected: ✅ 200 Response with:
   {
     "status": "APPROVED",
     "actionRequired": true,
     "message": "Leave approved for Mrs. Lakshmi Devi. Coverage status: NEEDS_ATTENTION. 4 slots need substitute assignment.",
     "coverageInfo": {
       "totalSlots": 4,
       "coverageStatus": "NEEDS_ATTENTION",
       "uncoveredSlots": [ /* 4 slots */ ],
       "coveredSlots": []
     }
   }
5. Note: uncoveredSlots show classEnrolled, subject, slotTime, status: "UNCOVERED"
```

### Test Case 2.2: View Timetable with Coverage Status
```
1. From Test 2.1, leave approved
2. HOD views Class 6 timetable for May 29
3. GET /api/timetable?class=Class%206&section=A&date=2026-05-29
4. Expected: ✅ Response includes:
   {
     "entries": [ /* standard entries */ ],
     "coverageStatus": {
       "date": "2026-05-29",
       "totalAffectedSlots": 4,
       "coveredSlots": 0,
       "uncoveredSlots": 4,
       "status": "NEEDS_ATTENTION",
       "message": "⚠️ 4 slot(s) need substitute assignment"
     },
     "leaveInfo": [
       {
         "slotNumber": 1,
         "slotTime": "09:00 - 09:45",
         "subject": "Mathematics",
         "absentStaffName": "Mrs. Lakshmi Devi",
         "hasCoverage": false,
         "coverageStatus": "UNCOVERED"
       },
       // ... more slots
     ]
   }
5. Verify: Banner shows "⚠️ 4 slot(s) need substitute assignment"
```

### Test Case 2.3: Get Coverage Details & Available Substitutes
```
1. From Test 2.2, coverage status available
2. HOD clicks "View Coverage Details"
3. GET /api/timetable/coverage?class=Class%206&date=2026-05-29
4. Expected: ✅ Response shows:
   {
     "coverageData": [
       {
         "date": "2026-05-29",
         "slot": { "number": 1, "time": "09:00 - 09:45" },
         "subject": "Mathematics",
         "absentStaff": { "name": "Mrs. Lakshmi Devi" },
         "coverage": {
           "status": "UNCOVERED",
           "availableSubstitutes": [
             { "id": 2, "name": "Mr. Rajesh Kumar", "assignedClass": "Class 11" },
             { "id": 1, "name": "Dr. Venkat Prasad", "assignedClass": null }
           ]
         }
       }
     ],
     "summary": {
       "totalSlots": 4,
       "coveredSlots": 0,
       "uncoveredSlots": 4
     }
   }
5. Note: Lists only teachers not on leave for that date
```

### Test Case 2.4: Assign Substitute for Uncovered Slot
```
1. From Test 2.3, available substitutes listed
2. HOD clicks "Assign Substitute" for P1 (09:00-09:45)
3. POST /api/timetable/coverage/assign-substitute {
     "absentStaffId": 3,
     "substituteStaffId": 2,
     "classEnrolled": "Class 6",
     "leaveId": 10
   }
4. Expected: ✅ 200 Response:
   {
     "success": true,
     "message": "Mr. Rajesh Kumar assigned as substitute for Mrs. Lakshmi Devi",
     "assignment": {
       "id": 1,
       "absentStaffId": 3,
       "substituteStaffId": 2,
       "classEnrolled": "Class 6",
       "assignedAt": "2026-05-27T14:30:00Z"
     }
   }
5. Verify: Coverage status now shows this slot as "COVERED"
```

### Test Case 2.5: Verify Updated Coverage
```
1. From Test 2.4, substitute assigned
2. HOD re-checks coverage
3. GET /api/timetable/coverage?class=Class%206&date=2026-05-29
4. Expected: ✅ Response shows:
   - That slot now has "status": "COVERED"
   - "substituteStaffName": "Mr. Rajesh Kumar"
   - Summary shows: "coveredSlots": 1, "uncoveredSlots": 3
```

---

## TEST CONFLICT 3: Complete Workflow

### Test Case 3.1: New Teacher Journey
```
STEP 1: Registration
- New teacher: Mrs. Priya Sharma
- Email: priya@kalnet.edu
- Role: CLASS_TEACHER
- Preferred Class: Class 7

POST /api/auth/signup {
  "name": "Mrs. Priya Sharma",
  "email": "priya@kalnet.edu",
  "password": "SecurePassword123",
  "role": "CLASS_TEACHER",
  "assignedClass": "Class 7"
}
Expected: ✅ Teacher created, awaiting HOD approval

STEP 2: Approval
- HOD approves Mrs. Priya Sharma
- Class 7 available (not assigned to anyone)

POST /api/hod/staff/8/approve {
  "assignedClass": "Class 7"
}
Expected: ✅ Teacher activated and assigned to Class 7

STEP 3: Verify in Timetable
- HOD can now see Mrs. Priya Sharma's slots in Class 7 timetable

GET /api/timetable?class=Class%207&section=A
Expected: ✅ Entries show staffId pointing to Mrs. Priya Sharma

STEP 4: Leave Request (2 weeks later)
- Mrs. Priya Sharma requests leave: May 29-30

POST /api/staff/leave/request {
  "leaveType": "Casual",
  "fromDate": "2026-05-29",
  "toDate": "2026-05-30",
  "reason": "Medical appointment"
}
Expected: ✅ Leave request created with status PENDING

STEP 5: Leave Approval (Coverage Check Auto-Runs)
- HOD approves leave

PATCH /api/hod/staff-leave/8/approve {
  "status": "APPROVED"
}
Expected: ✅ Response includes:
- coverageInfo with affected slots
- message about how many slots need coverage

STEP 6: View Timetable & See Coverage
- HOD checks Class 7 timetable for May 29

GET /api/timetable?class=Class%207&section=A&date=2026-05-29
Expected: ✅ Response shows:
- coverageStatus with "NEEDS_ATTENTION"
- leaveInfo showing uncovered slots
- Highlighting which slots need substitutes

STEP 7: Assign Substitutes
- HOD assigns substitutes for each uncovered slot

POST /api/timetable/coverage/assign-substitute { ... }
Expected: ✅ Each slot gets a substitute

STEP 8: Verify Coverage Complete
- HOD re-checks timetable

GET /api/timetable?class=Class%207&section=A&date=2026-05-29
Expected: ✅ All slots now show COVERED status
```

---

## DEBUGGING TIPS

### If Conflict 1 not returning options:
- Check Staff table - verify class is assigned to another active teacher
- Verify `isActive: true` for existing teacher
- Check response includes `resolutionOptions` object

### If Coverage not showing in Timetable:
- Add `?date=2026-05-29` parameter to GET /api/timetable request
- Check LeaveRequest table - ensure leave has `status: "APPROVED"`
- Verify TimetableEntry exists for that date and staff

### If Substitutes not listed:
- Check if substitute is on leave - they should be excluded
- Verify substitute exists and is active
- Check SubstituteAssignment table for duplicates

### If Tests Fail:
1. Clear browser cache
2. Verify current date is May 27, 2026 (or update dates in tests)
3. Check API response status codes
4. Look for error messages in console
5. Verify database connections

---

## Success Indicators

✅ **Conflict 1 Resolved When**:
- HOD can choose between: Approve-without-class, Swap, or Assign-alternative
- System correctly updates both teachers when swap is selected
- Available classes list is accurate

✅ **Conflict 2 Resolved When**:
- Leave approval returns coverage info automatically
- Timetable view shows coverage status with ?date parameter
- Uncovered slots can be assigned substitutes one-click
- Coverage status updates after substitute assignment

✅ **Conflict 3 Resolved When**:
- New teacher registration → approval → assignment workflow works seamlessly
- Leave request triggers coverage check automatically
- HOD sees everything in existing timetable view (no new tabs)
- Complete journey from registration to leave coverage visible in UI
