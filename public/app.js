document.addEventListener('DOMContentLoaded', () => {
    const recordForm = document.getElementById('recordForm');
    const recordsList = document.getElementById('recordsList');
    const verifyChainBtn = document.getElementById('verifyChain');
    const chainStatus = document.getElementById('chainStatus');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    const confirmDeleteBtn = document.getElementById('confirmDelete');

    let currentDeleteHash = null;

    // Initialize dark mode
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
    }

    // Dark mode toggle
    darkModeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            darkModeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
            localStorage.setItem('darkMode', 'false');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
            localStorage.setItem('darkMode', 'true');
        }
    });

    // Load existing records
    loadRecords();

    // Search functionality
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm) {
            searchRecords(searchTerm);
        } else {
            loadRecords();
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm) {
                searchRecords(searchTerm);
            } else {
                loadRecords();
            }
        }
    });

    // Add new record
    recordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            studentName: document.getElementById('studentName').value,
            studentId: document.getElementById('studentId').value,
            courseDetails: document.getElementById('courseDetails').value,
            grades: document.getElementById('grades').value
        };

        try {
            showLoading();
            const response = await fetch('/api/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (response.ok) {
                showAlert('Record added successfully!', 'success');
                recordForm.reset();
                loadRecords();
            } else {
                showAlert(result.error, 'danger');
            }
        } catch (error) {
            showAlert('Error adding record', 'danger');
        } finally {
            hideLoading();
        }
    });

    // Verify chain
    verifyChainBtn.addEventListener('click', async () => {
        try {
            showLoading();
            const response = await fetch('/api/verify');
            const result = await response.json();
            
            chainStatus.textContent = `Chain Status: ${result.isValid ? 'Valid' : 'Invalid'} (${result.blockCount} blocks)`;
            chainStatus.className = result.isValid ? 'valid' : 'invalid';
        } catch (error) {
            showAlert('Error verifying chain', 'danger');
        } finally {
            hideLoading();
        }
    });

    // Load records function
    async function loadRecords() {
        try {
            showLoading();
            const response = await fetch('/api/records');
            const records = await response.json();
            
            displayRecords(records.slice(1)); // Skip genesis block
        } catch (error) {
            showAlert('Error loading records', 'danger');
        } finally {
            hideLoading();
        }
    }

    // Search records function
    async function searchRecords(searchTerm) {
        try {
            showLoading();
            const response = await fetch('/api/records');
            const records = await response.json();
            
            const filteredRecords = records.slice(1).filter(block => 
                block.data.studentId.toLowerCase().includes(searchTerm) ||
                block.data.studentName.toLowerCase().includes(searchTerm)
            );
            
            displayRecords(filteredRecords);
        } catch (error) {
            showAlert('Error searching records', 'danger');
        } finally {
            hideLoading();
        }
    }

    // Display records function
    function displayRecords(records) {
        if (records.length === 0) {
            recordsList.innerHTML = '<div class="alert alert-info">No records found</div>';
            return;
        }

        recordsList.innerHTML = records.map(block => `
            <div class="list-group-item record-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1">${block.data.studentName}</h5>
                        <p class="mb-1">
                            <span class="badge bg-primary">ID: ${block.data.studentId}</span>
                        </p>
                        <p class="mb-1">Course: ${block.data.courseDetails}</p>
                        <p class="mb-1">Grades: ${block.data.grades}</p>
                        <small class="text-muted timestamp">Added: ${new Date(block.timestamp).toLocaleString()}</small>
                    </div>
                    <button class="btn btn-outline-danger delete-btn" onclick="deleteRecord('${block.hash}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <small class="text-muted hash-text">Block Hash: ${block.hash}</small>
                </div>
            </div>
        `).join('');
    }

    // Delete record function
    window.deleteRecord = function(hash) {
        currentDeleteHash = hash;
        deleteModal.show();
    };

    confirmDeleteBtn.addEventListener('click', async () => {
        if (currentDeleteHash) {
            try {
                showLoading();
                const response = await fetch(`/api/records/${currentDeleteHash}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showAlert('Record deleted successfully!', 'success');
                    loadRecords();
                } else {
                    const result = await response.json();
                    showAlert(result.error || 'Error deleting record', 'danger');
                }
            } catch (error) {
                showAlert('Error deleting record', 'danger');
            } finally {
                hideLoading();
                deleteModal.hide();
            }
        }
    });

    // Loading indicator functions
    function showLoading() {
        loadingIndicator.classList.remove('d-none');
    }

    function hideLoading() {
        loadingIndicator.classList.add('d-none');
    }

    // Helper function to show alerts
    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.querySelector('.container').insertBefore(alert, recordForm.parentElement.parentElement);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}); 