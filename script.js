if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
  
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let currentSort = 'default';
  
  const taskManagerContainer = document.querySelector(".taskManager");
  const confirmEl = document.querySelector(".confirm");
  const confirmedBtn = confirmEl.querySelector(".confirmed");
  const cancelledBtn = confirmEl.querySelector(".cancel");
  const sortSelect = document.getElementById('sortSelect');
  
  let indexToBeDeleted = null;
  
  document.getElementById('taskForm').addEventListener('submit', handleFormSubmit);
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    renderTasks();
  });
  
  function handleFormSubmit(event) {
    event.preventDefault();
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const priorityInput = document.getElementById('priorityInput');
  
    const taskText = taskInput.value.trim();
    const dueDateValue = dueDateInput.value;
    const priorityValue = priorityInput.value;
  
    if (taskText === '') return;
  
    const newTask = {
      text: taskText,
      completed: false,
      createdAt: Date.now(),
      notified: false,
      dueDate: dueDateValue ? new Date(dueDateValue).getTime() : null,
      priority: priorityValue || "Low"
    };
  
    tasks.push(newTask);
    saveTasks();
  
    taskInput.value = '';
    dueDateInput.value = '';
    priorityInput.value = 'Low';
  
    renderTasks();
  }
  
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }
  
  function sortTasks(taskList) {
    if (currentSort === 'priority') {
      // Priority order: High > Medium > Low
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return taskList.slice().sort((a, b) => {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    }
    if (currentSort === 'dueDate') {
      return taskList.slice().sort((a, b) => {
        if (a.dueDate === null) return 1;
        if (b.dueDate === null) return -1;
        return a.dueDate - b.dueDate;
      });
    }
    // default sorting by creation time (oldest first)
    return taskList.slice().sort((a, b) => a.createdAt - b.createdAt);
  }
  
  function renderTasks() {
    const taskContainer = document.getElementById('taskContainer');
    taskContainer.innerHTML = '';
  
    const sortedTasks = sortTasks(tasks);
  
    sortedTasks.forEach((task, indexSorted) => {
      // Find original index for mutation
      const index = tasks.findIndex(t => t.createdAt === task.createdAt);
  
      const taskCard = document.createElement('div');
      taskCard.classList.add('taskCard');
      let classVal = task.completed ? "completed" : "pending";
      taskCard.classList.add(classVal);
  
      // Check if this task is being edited
      if (task.editing) {
        taskCard.classList.add('editing');
  
        // Editable inputs
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = task.text;
  
        const dueDateInput = document.createElement('input');
        dueDateInput.type = 'datetime-local';
        if (task.dueDate) {
          // Format to YYYY-MM-DDTHH:mm for input value
          const dt = new Date(task.dueDate);
          dueDateInput.value = dt.toISOString().slice(0,16);
        }
  
        const prioritySelect = document.createElement('select');
        ['Low', 'Medium', 'High'].forEach(level => {
          const opt = document.createElement('option');
          opt.value = level;
          opt.text = level;
          if (level === task.priority) opt.selected = true;
          prioritySelect.appendChild(opt);
        });
  
        const editButtonsDiv = document.createElement('div');
        editButtonsDiv.classList.add('editButtons');
  
        const saveBtn = document.createElement('button');
        saveBtn.classList.add('saveBtn');
        saveBtn.textContent = 'Save';
  
        saveBtn.addEventListener('click', () => {
          const newText = textInput.value.trim();
          const newDueDate = dueDateInput.value ? new Date(dueDateInput.value).getTime() : null;
          const newPriority = prioritySelect.value;
  
          if (newText === '') {
            alert("Task text can't be empty.");
            return;
          }
  
          tasks[index].text = newText;
          tasks[index].dueDate = newDueDate;
          tasks[index].priority = newPriority;
          tasks[index].editing = false;
          saveTasks();
          renderTasks();
        });
  
        const cancelBtn = document.createElement('button');
        cancelBtn.classList.add('cancelBtn');
        cancelBtn.textContent = 'Cancel';
  
        cancelBtn.addEventListener('click', () => {
          tasks[index].editing = false;
          renderTasks();
        });
  
        editButtonsDiv.appendChild(saveBtn);
        editButtonsDiv.appendChild(cancelBtn);
  
        taskCard.appendChild(textInput);
        taskCard.appendChild(dueDateInput);
        taskCard.appendChild(prioritySelect);
        taskCard.appendChild(editButtonsDiv);
  
      } else {
        // Normal display mode
  
        const taskText = document.createElement('p');
        taskText.innerText = task.text;
  
        const taskStatus = document.createElement('p');
        taskStatus.classList.add('status');
        taskStatus.innerText = task.completed ? "Completed" : "Pending";
  
        // Due date display
        const dueDateEl = document.createElement('p');
        dueDateEl.classList.add('due-date');
        if (task.dueDate) {
          const dateObj = new Date(task.dueDate);
          dueDateEl.innerText = `Due: ${dateObj.toLocaleString()}`;
        } else {
          dueDateEl.innerText = "No Due Date";
          dueDateEl.style.color = '#999';
        }
  
        // Priority display
        const priorityEl = document.createElement('p');
        priorityEl.classList.add('priority', task.priority);
        priorityEl.innerText = `Priority: ${task.priority}`;
  
        // Buttons
  
        // Toggle complete
        const toggleButton = document.createElement('button');
        toggleButton.classList.add("button-box");
        const btnContentEl = document.createElement("span");
        btnContentEl.classList.add("green");
        btnContentEl.innerText = task.completed ? 'Mark as Pending' : 'Mark as Completed';
        toggleButton.appendChild(btnContentEl);
        toggleButton.addEventListener('click', () => {
          tasks[index].completed = !tasks[index].completed;
          if (!tasks[index].completed) {
            tasks[index].notified = false; // Reset notification flag when reopened
          }
          saveTasks();
          renderTasks();
        });
  
        // Edit button
        const editButton = document.createElement('button');
        editButton.classList.add("button-box");
        const editBtnContentEl = document.createElement("span");
        editBtnContentEl.classList.add("blue");
        editBtnContentEl.innerText = 'Edit';
        editButton.appendChild(editBtnContentEl);
        editButton.addEventListener('click', () => {
          tasks[index].editing = true;
          renderTasks();
        });
  
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.classList.add("button-box");
        const delBtnContentEl = document.createElement("span");
        delBtnContentEl.classList.add("red");
        delBtnContentEl.innerText = 'Delete';
        deleteButton.appendChild(delBtnContentEl);
        deleteButton.addEventListener('click', () => {
          indexToBeDeleted = index;
          confirmEl.style.display = "block";
          taskManagerContainer.classList.add("overlay");
        });
  
        // Append all elements
        taskCard.appendChild(taskText);
        taskCard.appendChild(taskStatus);
        taskCard.appendChild(dueDateEl);
        taskCard.appendChild(priorityEl);
        taskCard.appendChild(toggleButton);
        taskCard.appendChild(editButton);
        taskCard.appendChild(deleteButton);
      }
  
      taskContainer.appendChild(taskCard);
    });
  }
  
  function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
  
  confirmedBtn.addEventListener("click", () => {
    confirmEl.style.display = "none";
    taskManagerContainer.classList.remove("overlay");
    deleteTask(indexToBeDeleted);
  });
  
  cancelledBtn.addEventListener("click", () => {
    confirmEl.style.display = "none";
    taskManagerContainer.classList.remove("overlay");
  });
  
  // Notification checker, runs every 30 sec, alerts if task is within 5 mins or overdue
  setInterval(() => {
    if (Notification.permission === 'granted') {
      const now = Date.now();
      tasks.forEach((task, idx) => {
        if (!task.completed && task.dueDate && !task.notified) {
          const diff = task.dueDate - now;
          if (diff <= 300000) { // 5 minutes or overdue
            new Notification('Task Reminder', {
              body: `Task "${task.text}" is ${diff < 0 ? 'overdue!' : 'due soon!'}`,
              icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827279.png'
            });
            tasks[idx].notified = true;
            saveTasks();
          }
        }
      });
    }
  }, 30000);
  
  renderTasks();
  