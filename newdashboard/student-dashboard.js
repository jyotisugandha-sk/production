document.addEventListener("DOMContentLoaded", function () {

  // ===== FETCH STUDENT PROFILE =====
  fetch(`/api/students/profile`)
    .then(response => {
      if (!response.ok) throw new Error(`Failed to fetch student profile. Status: ${response.status}`);
      return response.json();
    })
    .then(student => {
      console.log("Student Profile Data:", student);

      // ✅ Update profile info
      document.querySelector(".profile-span").textContent = `${student.fname} ${student.lname}`;
      const profileImg = document.querySelector(".profile-icon-img");
      profileImg.src = student.imageUrl || "/images/homeImages/user.png";

      document.querySelector(".roll-number").textContent = student.rollNumber || "-";
      document.querySelector(".class-name").textContent = student.className || "-";
      document.querySelector(".section-name").textContent = student.section || "-";
      document.querySelector(".phone-number").textContent = student.phone || "-";
      document.querySelector(".email-id").textContent = student.email || "-";

      // Load attendance after profile
      loadAttendance();
      // Load notices after profile
      loadNotices(student);
      // Load timetable after profile
      loadTimeTable(student);
	  
	  loadAssignments(student);
	  
	  loadExamMarks(); // <-- Add this call here
	  
	  fetchStudentNotes();
	  
	  fetchStudentSyllabus(student);
	  
	  loadFeeChart();
	  
	  if (student && (student.id || student.id === 0)) {
	          loadBusDetails(student.id);
	        } else {
	          // fallback to generic endpoint if student id not present
	          loadBusDetails();
	        }
	  
	  
    })
    .catch(error => {
      console.error("Error loading student profile:", error);
      alert("⚠️ Failed to load student profile. Please try again later.");
    });
	
	async function loadAssignments() {
	  const card = document.querySelector(".assignments-card");
	  card.innerHTML = `<h2><i class="bi bi-journal-text"></i> Assignments</h2>`;

	  try {
	    // ---- 1. Fetch all assignments for student ----
	    const assignmentsRes = await fetch(`/api/assignments/student/assignments`);
	    if (!assignmentsRes.ok) throw new Error("Failed to fetch assignments");
	    const assignments = await assignmentsRes.json();

	    if (!assignments || assignments.length === 0) {
	      card.insertAdjacentHTML("beforeend", `<p>No assignments found</p>`);
	      return;
	    }

	    // ---- 2. Fetch student's submitted assignments ----
	    const submissionsRes = await fetch(`/api/assignment-submissions/student/my-submissions`);
	    if (!submissionsRes.ok) throw new Error("Failed to fetch submissions");
	    const submissions = await submissionsRes.json();

	    // ---- 3. Create a set of submitted assignment IDs ----
	    const submittedIds = new Set(submissions.map(s => s.assignmentId));

	    // ---- 4. Calculate counts ----
	    const submittedCount = submittedIds.size;
	    const pendingCount = assignments.length - submittedCount;

	    // ---- 5. Render assignments list ----
		// Create responsive grid container for assignment cards
		const list = document.createElement("div");
		list.className = "assignments-list grid gap-6 sm:grid-cols-2 lg:grid-cols-3"; 
		// gap-6 => space between cards; grid adjusts automatically for mobile/tablet/desktop

		assignments.forEach(a => {
		  const isSubmitted = submittedIds.has(a.id);

		  const div = document.createElement("div");
		  div.className = "assignment-item p-4 rounded-2xl shadow-lg transition-transform duration-200 cursor-pointer";
		  div.style.border = "1px solid #ccc";
		  div.style.background = isSubmitted ? "#a8dadc" : "#ffadad";
		  div.style.color = "#2c2c2c";

		  div.innerHTML = `
		    <strong class="block text-lg font-semibold mb-1">${a.title}</strong>
		    <p class="text-sm text-gray-800 mb-1">Subject: ${a.subject} | Due: ${a.dueDate}</p>
		    <p class="text-sm font-medium ${isSubmitted ? 'text-green-700' : 'text-red-700'}">
		      ${isSubmitted ? '✅ Submitted' : '⏳ Pending'}
		    </p>
		  `;

		  // Hover effect
		  div.addEventListener("mouseenter", () => {
		    div.style.transform = "translateY(-6px)";
		    div.style.boxShadow = "0 10px 20px rgba(0,0,0,0.15)";
		  });
		  div.addEventListener("mouseleave", () => {
		    div.style.transform = "translateY(0)";
		    div.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
		  });

		  // Make card clickable
		  div.addEventListener("click", () => {
		    window.location.href = `/students/assignment-details?assignmentId=${a.id}`;
		  });

		  list.appendChild(div);
		});

		// Append to main container
		//card.appendChild(list);



	    // ---- 6. Show counts ----
	    card.insertAdjacentHTML("beforeend", `<p>Pending: ${pendingCount}</p><p>Submitted: ${submittedCount}</p>`);
	    card.appendChild(list);

	  } catch (err) {
	    console.error(err);
	    card.insertAdjacentHTML("beforeend", `<p class="text-danger">Failed to load assignments</p>`);
	  }
	}

	// ===== FETCH STUDENT SYLLABUS =====
	 async function fetchStudentSyllabus(student) {
	   const syllabusCard = document.querySelector(".syllabus-card");
	   syllabusCard.innerHTML = `<h2><i class="bi bi-book-half"></i> Syllabus</h2>`;

	   const className = student.className;
	   const section = student.section;

	   try {
	     const res = await fetch(`/api/syllabus/${className}/${section}`);
	     if (!res.ok) throw new Error("Failed to fetch syllabus");

	     const data = await res.json();
	     console.log("Syllabus data:", data);

	     if (!data || data.length === 0) {
	       syllabusCard.insertAdjacentHTML("beforeend", `<p class="text-center text-muted">No syllabus found</p>`);
	       return;
	     }

	     // Create responsive grid layout
	     const grid = document.createElement("div");
	     grid.className = "row g-4"; // bootstrap gap between cards

	     data.forEach((s, i) => {
	       const col = document.createElement("div");
	       col.className = "col-sm-12 col-md-6 col-lg-4";

	       const card = document.createElement("div");
	       card.className = "card shadow-sm h-100";
	       card.style.borderRadius = "14px";
	       card.style.transition = "all 0.2s";

	       card.innerHTML = `
	         <div class="card-body d-flex flex-column justify-content-between">
	           <div>
	             <h6 class="badge bg-primary mb-2">Class: ${s.className} | Section: ${s.section}</h6>
	             <h5 class="card-title text-capitalize" style="color: teal;">${s.subject}</h5>
	             <p class="text-muted small mb-1">Type: ${s.fileType || "N/A"}</p>
	             <p class="text-muted small mb-2">Size: ${s.fileSize ? s.fileSize + " KB" : "-"}</p>
	             <small class="text-muted">Uploaded By: ${s.uploadedBy}</small>
	           </div>
	           <div class="mt-3">
	             ${s.fileUrl
	               ? `<a href="${s.fileUrl}" target="_blank" class="btn btn-sm btn-success w-100">📘 View File</a>`
	               : `<button class="btn btn-sm btn-secondary w-100" disabled>No File</button>`}
	           </div>
	         </div>
	       `;

	       // Hover effect
	       card.addEventListener("mouseenter", () => {
	         card.style.transform = "translateY(-5px)";
	         card.style.boxShadow = "0 10px 20px rgba(0,0,0,0.15)";
	       });
	       card.addEventListener("mouseleave", () => {
	         card.style.transform = "translateY(0)";
	         card.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
	       });

	       col.appendChild(card);
	       grid.appendChild(col);
	     });

	     syllabusCard.appendChild(grid);

	   } catch (err) {
	     console.error(err);
	     syllabusCard.insertAdjacentHTML("beforeend", `<p class="text-danger">Failed to load syllabus</p>`);
	   }
	 }

  // ===== FETCH AND RENDER ATTENDANCE =====
  function loadAttendance() {
    const attendanceCard = document.querySelector(".attendance-card");

    fetch(`/api/students/my-attendance`)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch attendance: ${response.status}`);
        return response.json();
      })
      .then(data => {
        console.log("Attendance data:", data);

        attendanceCard.querySelectorAll("p, .progress-bar, .attendance-stats").forEach(el => el.remove());

        if (!data || data.length === 0) {
          attendanceCard.insertAdjacentHTML("beforeend", `<p>No attendance data found</p>`);
          return;
        }

        const subjectMap = {};
        data.forEach(attendanceDto => {
          if (!attendanceDto.dailyAttendance) return;
          attendanceDto.dailyAttendance.forEach(att => {
            const subj = att.subjectName || "Unknown";
            if (!subjectMap[subj]) subjectMap[subj] = { total: 0, present: 0, daily: [] };
            subjectMap[subj].total += 1;
            if (att.status === "PRESENT") subjectMap[subj].present += 1;
            subjectMap[subj].daily.push({ status: att.status, date: att.date });
          });
        });

        const subjects = Object.keys(subjectMap).sort();
        if (subjects.length === 0) {
          attendanceCard.insertAdjacentHTML("beforeend", `<p>No subjects attendance found</p>`);
          return;
        }

        subjects.forEach(subjectName => {
          const stats = subjectMap[subjectName];
          const percentage = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);
          const color = getColor(subjectName);

          const p = document.createElement("p");
          p.textContent = subjectName;
          attendanceCard.appendChild(p);

          const progressBar = document.createElement("div");
          progressBar.className = "progress-bar";
          progressBar.style.position = "relative";
          attendanceCard.appendChild(progressBar);

          stats.daily.forEach(day => {
            const marker = document.createElement("div");
            marker.className = "progress-marker";
            marker.style.flex = `0 0 ${100 / stats.daily.length}%`;
            marker.style.background = day.status === "PRESENT" ? color : "#e63946"; // red for absent
            marker.title = `${day.date} - ${day.status}`;
            progressBar.appendChild(marker);
          });

          const fill = document.createElement("div");
          fill.className = "progress-fill";
          fill.style.width = `${percentage}%`;
          fill.style.background = color;
          fill.textContent = `${percentage}%`;
          fill.style.position = "absolute";
          fill.style.top = "0";
          fill.style.left = "0";
          fill.style.height = "100%";
          fill.style.color = "#000";
          fill.style.fontWeight = "bold";
          fill.style.textAlign = "center";
          progressBar.appendChild(fill);

          const statsText = document.createElement("p");
          statsText.className = "attendance-stats";
          statsText.textContent = `Present: ${stats.present} / Total: ${stats.total}`;
          attendanceCard.appendChild(statsText);
        });
      })
      .catch(err => {
        console.error(err);
        attendanceCard.insertAdjacentHTML("beforeend", `<p>Failed to load attendance</p>`);
      });
  }

  const colorPalette = ["#a8dadc", "#ffd6a5", "#caffbf", "#ffcad4", "#bdb2ff", "#ffb3c1", "#ffe066"];
  const colorMap = {};
  function getColor(subject) {
    if (!colorMap[subject]) {
      const index = Object.keys(colorMap).length % colorPalette.length;
      colorMap[subject] = colorPalette[index];
    }
    return colorMap[subject];
  }
//=========Fee fuction==========
async function loadFeeChart() {
    const feeSummary = document.getElementById("feeSummary");
    const ctx = document.getElementById("feeChart").getContext("2d");

    try {
      const response = await fetch(`/api/students/my-fees`);
      if (!response.ok) throw new Error("Failed to fetch fee data");
      const fees = await response.json();
      console.log("Fee data:", fees);

      if (!fees || fees.length === 0) {
        feeSummary.textContent = "No fee records found.";
        return;
      }

      // Calculate totals
      const totalFee = fees.reduce((sum, f) => sum + (f.totalFee || 0), 0);
      const paidFee = fees.reduce((sum, f) => sum + (f.paidFee || 0), 0);
      const pendingFee = totalFee - paidFee;

      // Summary text
      feeSummary.textContent = `💰 Total: ₹${totalFee} | ✅ Paid: ₹${paidFee} | ⏳ Pending: ₹${pendingFee}`;

      // Destroy old chart if exists
      if (window.feeChartInstance) window.feeChartInstance.destroy();

      // Draw new Chart
      window.feeChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Paid", "Pending"],
          datasets: [
            {
              data: [paidFee, pendingFee],
              backgroundColor: ["#4CAF50", "#FF5252"],
              borderColor: "#fff",
              borderWidth: 2,
            },
          ],
        },
        options: {
          cutout: "65%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#333",
                font: { size: 14, family: "Poppins" },
              },
            },
          },
        },
      });

    } catch (err) {
      console.error("Error loading fee data:", err);
      feeSummary.textContent = "⚠️ Failed to load fee details.";
    }
  }
  // ===== FETCH AND RENDER NOTICES =====
  function loadNotices(student) {
    const noticesCard = document.querySelector(".notices-card");
    noticesCard.innerHTML = `<h2 class="mb-4"><i class="bi bi-bell-fill"></i> Notices</h2>`;

    fetch(`/api/notices/student?page=0&size=10`)
      .then(res => res.json())
      .then(data => {
        const notices = data.content || [];
        if (notices.length === 0) {
          noticesCard.insertAdjacentHTML("beforeend", `<p class="text-muted">No notices found</p>`);
          return;
        }

        const cardContainer = document.createElement("div");
        cardContainer.className = "row g-4";
        noticesCard.appendChild(cardContainer);

        notices.forEach(n => {
          const audience = n.audience;
          const classMatch = n.targetClassName ? n.targetClassName.trim().toLowerCase() === student.className.trim().toLowerCase() : true;
          const sectionMatch = n.targetSection ? n.targetSection.trim().toLowerCase() === student.section.trim().toLowerCase() : true;

          if (
            audience === "ALL" ||
            audience === "SCHOOL_WIDE" ||
            audience === "STUDENTS" ||
            (audience === "CLASS" && classMatch) ||
            (audience === "SECTION" && classMatch && sectionMatch)
          ) {
            const col = document.createElement("div");
            col.className = "col-md-6";

            const card = document.createElement("div");
            card.className = "card shadow-sm notice-card";
            card.style.cursor = "pointer";
            card.style.transition = "transform 0.2s, box-shadow 0.2s";
            card.style.borderRadius = "12px";
            card.style.padding = "0.75rem";
            card.style.marginBottom = "1rem";
            card.style.maxHeight = "200px";  // medium card
            card.style.display = "flex";
            card.style.flexDirection = "column";

            // Background by importance
            switch (n.importance) {
              case 1:
                card.style.borderLeft = "6px solid #0d6efd";
                card.style.backgroundColor = "#ffffff";
                break;
              case 2:
                card.style.borderLeft = "6px solid #ffc107";
                card.style.backgroundColor = "#fff8e1";
                break;
              case 3:
                card.style.borderLeft = "6px solid #dc3545";
                card.style.backgroundColor = "#f8d7da";
                break;
              default:
                card.style.borderLeft = "6px solid #6c757d";
                card.style.backgroundColor = "#e2e3e5";
            }

            card.addEventListener("mouseenter", () => {
              card.style.transform = "translateY(-5px)";
              card.style.boxShadow = "0 10px 25px rgba(0,0,0,0.35)";
            });
            card.addEventListener("mouseleave", () => {
              card.style.transform = "translateY(0)";
              card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
            });

            const cardBody = document.createElement("div");
            cardBody.className = "card-body p-2";
            cardBody.style.overflowY = "auto"; // scroll content
            cardBody.style.flex = "1 1 auto";  // take remaining space
            
            cardBody.innerHTML = `
              <p class="text-secondary mb-1" style="font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <i class="bi bi-megaphone-fill"></i> ${audience}
                ${n.targetClassName ? " | " + n.targetClassName : ""}
                ${n.targetSection ? " " + n.targetSection : ""}
                <span class="badge ms-2" style="background-color: ${n.importance === 1 ? '#0d6efd' : n.importance === 2 ? '#ffc107' : '#dc3545'}; color: #fff;">
                  Importance ${n.importance}
                </span>
              </p>
              <h5 class="card-title mb-2" style="font-weight: 600; font-size: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                <i class="bi bi-file-earmark-text"></i> ${n.title}
              </h5>
              <p class="card-text mb-2" style="font-size: 0.85rem; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;">
                ${n.body}
              </p>
              <p class="text-muted mb-0" style="font-size: 0.75rem;">
                <i class="bi bi-calendar-event"></i> ${n.date || "N/A"}
              </p>
            `;

            if (n.fileUrl) {
              const fileLink = document.createElement("a");
              fileLink.href = n.fileUrl;
              fileLink.target = "_blank";
              fileLink.className = "btn btn-outline-primary btn-sm mt-1 d-inline-flex align-items-center";
              fileLink.style.textDecoration = "none";
              fileLink.innerHTML = `<i class="bi bi-file-earmark-arrow-down me-1"></i> View File`;
              cardBody.appendChild(fileLink);
            }

            card.appendChild(cardBody);
            col.appendChild(card);
            cardContainer.appendChild(col);

            card.addEventListener("click", () => {
              document.getElementById("studentNoticeModalLabel").innerText = n.title;
              document.getElementById("studentNoticeBody").innerText = n.body;
              document.getElementById("studentNoticeDate").innerText = n.date || "N/A";

              const fileLink = document.getElementById("studentNoticeFile");
              if (n.fileUrl) {
                fileLink.href = n.fileUrl;
                fileLink.style.display = "inline-flex";
                fileLink.innerHTML = `<i class="bi bi-file-earmark-arrow-down me-1"></i> View File`;
              } else {
                fileLink.style.display = "none";
              }

              new bootstrap.Modal(document.getElementById("studentNoticeModal")).show();
            });
          }
        });
      })
      .catch(err => {
        console.error(err);
        noticesCard.insertAdjacentHTML("beforeend", `<p class="text-danger">Failed to load notices</p>`);
      });
  }

  // ===== FETCH AND RENDER TIMETABLE =====
 
  function loadTimeTable(student) {
      const container = document.querySelector(".timetable-card");
      container.innerHTML = `<h2><i class="bi bi-table"></i> Today's Timetable</h2>`;

      fetch("/api/timetable/student")
          .then(res => res.json())
          .then(data => {
              if (data.holiday) {
                  container.insertAdjacentHTML(
                      "beforeend",
                      `<p class="text-muted">No classes today – ${data.holidayReason}</p>`
                  );
                  return;
              }

              if (!data.periods || data.periods.length === 0) {
                  container.insertAdjacentHTML(
                      "beforeend",
                      "<p class='text-muted'>No timetable available for today</p>"
                  );
                  return;
              }

              // Separate lunch/break period
              const periods = data.periods;
              const lunchIndex = periods.findIndex(p =>
                  p.subjectName.toLowerCase().includes("lunch") || 
                  p.subjectName.toLowerCase().includes("break")
              );

              let beforeLunch = [];
              let afterLunch = [];
              let lunchPeriod = null;

              if (lunchIndex !== -1) {
                  beforeLunch = periods.slice(0, lunchIndex);
                  lunchPeriod = periods[lunchIndex];
                  afterLunch = periods.slice(lunchIndex + 1);
              } else {
                  const mid = Math.ceil(periods.length / 2);
                  beforeLunch = periods.slice(0, mid);
                  afterLunch = periods.slice(mid);
              }

              // Create first table
              const table1 = document.createElement("table");
              table1.className = "styled-table";
              table1.innerHTML = `<tr><th>Time</th><th>Subject</th><th>Teacher</th></tr>`;
              beforeLunch.forEach(p => {
                  const row = document.createElement("tr");
                  row.innerHTML = `
                      <td>${p.periodStart} - ${p.periodEnd}</td>
                      <td>${p.subjectName}</td>
                      <td>${p.teacherName || "-"}</td>
                  `;
                  table1.appendChild(row);
              });

              // Lunch alert (single row text)
              const lunchAlert = document.createElement("div");
              lunchAlert.className = "alert alert-success text-center";
              lunchAlert.style.cssText = `
                  font-size:larger;
                  font-weight:bold;
                  margin: 10px 0;
                  padding: 8px 0;
                  border-radius: 8px;
                  width: auto;
                  display: inline-block;
              `;
              lunchAlert.innerHTML = "&nbsp; L &nbsp; U &nbsp; N &nbsp; C &nbsp; H &nbsp;&nbsp;&nbsp; T &nbsp; I &nbsp; M &nbsp; E &nbsp;";

              // Create second table
              const table2 = document.createElement("table");
              table2.className = "styled-table";
              table2.innerHTML = `<tr><th>Time</th><th>Subject</th><th>Teacher</th></tr>`;
              afterLunch.forEach(p => {
                  const row = document.createElement("tr");
                  row.innerHTML = `
                      <td>${p.periodStart} - ${p.periodEnd}</td>
                      <td>${p.subjectName}</td>
                      <td>${p.teacherName || "-"}</td>
                  `;
                  table2.appendChild(row);
              });

              // Flex wrapper for vertical centering
              const wrapper = document.createElement("div");
              wrapper.style.display = "flex";
              wrapper.style.flexDirection = "column";
              wrapper.style.height = "100%";
              wrapper.style.justifyContent = "center"; // center vertically
              wrapper.style.alignItems = "center";     // center horizontally
              wrapper.style.gap = "10px";              // equal spacing

              table1.style.width = "100%";
              table2.style.width = "100%";

              wrapper.appendChild(table1);
              wrapper.appendChild(lunchAlert);
              wrapper.appendChild(table2);
              container.appendChild(wrapper);
          })
          .catch(err => {
              console.error(err);
              container.insertAdjacentHTML(
                  "beforeend",
                  "<p class='text-danger'>Failed to load timetable</p>"
              );
          });
  }

  function loadExamMarks() {
      const marksCard = document.querySelector(".exam-marks-card");
      marksCard.innerHTML = `<h2><i class="bi bi-clipboard-data"></i> Exam Marks</h2>`;

      fetch(`/api/students/my-marks`)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch exam marks: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (!data || data.length === 0) {
            marksCard.insertAdjacentHTML("beforeend", `<p>No exam marks found</p>`);
            return;
          }

          const table = document.createElement("table");
          table.className = "styled-table";
          table.innerHTML = `
            <tr>
              <th>Subject</th>
              <th>Marks Obtained</th>
              <th>Max Marks</th>
              <th>Exam Date</th>
              <th>Result</th>
            </tr>
          `;

          data.forEach(mark => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${mark.subjectName || "-"}</td>
              <td>${mark.obtainedMarks != null ? mark.obtainedMarks : "-"}</td>
              <td>${mark.maxMarks != null ? mark.maxMarks : "-"}</td>
              <td>${mark.examDate ? new Date(mark.examDate).toLocaleDateString() : "-"}</td>
              <td style="color:${mark.result === "PASS" ? "green" : "red"}; font-weight:bold;">
                ${mark.result || "-"}
              </td>
            `;
            table.appendChild(row);
          });

          marksCard.appendChild(table);
        })
        .catch(err => {
          console.error(err);
          marksCard.insertAdjacentHTML("beforeend", `<p class="text-danger">Failed to load exam marks</p>`);
        });
    }

	
	// ✅ Call this when student dashboard loads
	function fetchStudentNotes() {
	    fetch(`/api/notes/student/my-notes`)
	        .then(res => {
	            if (!res.ok) throw new Error("Failed to fetch notes");
	            return res.json();
	        })
	        .then(notes => renderStudentNotes(notes))
	        .catch(err => showToast("❌ " + err.message, "danger"));
	}
	
	function renderStudentNotes(notes) {
	    const container = document.querySelector('.results-card');
	    container.innerHTML = `<h2><i class="bi bi-journal-richtext"></i> Notes</h2>`; // clear previous content

	    if (!notes || notes.length === 0) {
	        container.innerHTML = `<p class="text-center text-muted mt-3">No Notes Found</p>`;
	        return;
	    }

	    // Row container with Bootstrap gap
	    const row = document.createElement("div");
	    row.className = "row g-4"; // g-4 adds nice spacing between cards

	    notes.forEach((n, index) => {
	        const col = document.createElement("div");
	        col.className = "col-sm-12 col-md-6 col-lg-4";

	        col.innerHTML = `
	            <div class="card shadow-sm h-100">
	                <div class="card-body d-flex flex-column justify-content-between">
	                    <div>
	                        <h6 class="badge bg-primary mb-2">Class: ${n.className} | Section: ${n.section}</h6>
	                        <h5 class="card-title text-capitalize" style="color: cadetblue;">${n.title}</h5>
	                        <p class="mb-1"><strong>Subject:</strong> ${n.subject}</p>
	                        <p class="card-text"><strong>Comment:</strong> ${n.comment || '-'}</p>
	                        <small class="text-muted">Uploaded By: ${n.uploadedBy}</small>
	                    </div>
	                    <div class="mt-3">
	                        ${n.fileUrl ? `<a href="${n.fileUrl}" target="_blank" class="btn btn-sm btn-success w-100">📄 View PDF</a>` : ''}
	                    </div>
	                </div>
	            </div>
	        `;

	        row.appendChild(col);
	    });

	    container.appendChild(row);
	}

	
	async function loadBusDetails(studentId) {
	    try {
	      // Choose endpoint based on presence of studentId
	      const endpoint = (typeof studentId !== "undefined" && studentId !== null)
	        ? `/api/students/${studentId}/bus-details`
	        : `/api/student/bus-details`;

	      const res = await fetch(endpoint);

	      // handle non-JSON responses gracefully
	      if (!res.ok) {
	        console.warn("❌ No bus details found for this student (status " + res.status + ")");
	        writeNoBusAssigned();
	        return;
	      }

	      const data = await res.json();

	      // If backend sends a "message" telling no bus assigned, treat it as no bus
	      if (data && data.message) {
	        writeNoBusAssigned();
	        return;
	      }

	      // Render into targeted DOM places safely
	      renderBusDetails(data);
	    } catch (err) {
	      console.error("Error loading bus details:", err);
	      writeNoBusAssigned("Failed to load bus details");
	    }
	  }

	  function writeNoBusAssigned(fallbackText = "No Bus Assigned") {
	    const busInfoEl = document.getElementById("bus-info");
	    if (busInfoEl) {
	      busInfoEl.innerHTML = `<p class="text-danger">${fallbackText}</p>`;
	    }

	    const spanIds = ["busNumber", "busRoute", "pickupPoint", "driverName", "driverContact"];
	    spanIds.forEach(id => {
	      const el = document.getElementById(id);
	      if (el) el.innerText = (id === "busNumber" ? "Not Assigned" : "Not Available");
	    });

	    const container = document.getElementById("busDetailsContainer");
	    if (container && container.childElementCount === 0) {
	      container.innerHTML = `<p class='text-danger'>${fallbackText}</p>`;
	    }
	  }

	  function renderBusDetails(bus) {
	      // Update fields safely
	      const set = (id, val) => {
	          const el = document.getElementById(id);
	          if (el) el.innerText = val || "N/A";
	      };

	      set("busNumber", bus.busNumber);
	      set("busRoute", bus.routeName || bus.title);
	      set("pickupPoint", bus.pickupPoint);
	      set("driverName", bus.driverName);
	      set("driverContact", bus.driverMobile || bus.driverContact);
	      set("helperName", bus.helperName);
	      set("helperMobile", bus.helperMobile);

	      console.log("Bus details updated:", bus);
	  }

		  
		 






  // ===== TEXT TRUNCATE HELPER =====
  function truncateText(text, limit) {
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  }

});
