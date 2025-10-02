import { archiveNote, deleteNote, unarchiveNote } from '../data/api.js';
import { escapeHtml, hideGlobalLoading, showGlobalLoading, showToast } from '../utils/index.js';

// Custom Element: App Header
class AppHeader extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <h1>🌸 Pink Notes App</h1>
      <p>Catat semua ide dan pemikiranmu di sini</p>
    `;
  }
}

// Custom Element: Note Form
class NoteForm extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  resetForm() {
    const form = this.querySelector('form');
    if (form) {
      form.reset();
    }

    const inputs = this.querySelectorAll('.form-control');
    inputs.forEach(input => {
      if (input) {
        input.style.borderColor = '#ffc6d0';
      }
    });

    const errors = this.querySelectorAll('.error-message');
    errors.forEach(error => {
      if (error) {
        error.style.display = 'none';
      }
    });
  }

  render() {
    this.innerHTML = `
      <h2><i class="fas fa-plus-circle"></i> Tambah Catatan Baru</h2>
      <form id="noteForm">
        <div class="form-group">
          <label for="title">Judul</label>
          <input type="text" id="title" class="form-control" placeholder="Masukkan judul catatan" required aria-describedby="titleError">
          <div class="error-message" id="titleError">Judul harus diisi (min. 5 karakter)</div>
        </div>
        <div class="form-group">
          <label for="body">Isi Catatan</label>
          <textarea id="body" class="form-control" placeholder="Tulis isi catatan di sini..." required aria-describedby="bodyError"></textarea>
          <div class="error-message" id="bodyError">Isi catatan harus diisi (min. 10 karakter)</div>
        </div>
        <button type="submit" class="btn">
          <i class="fas fa-plus"></i> Tambah Catatan
        </button>
      </form>
    `;
  }

  setupEventListeners() {
    const form = this.querySelector('#noteForm');
    const titleInput = this.querySelector('#title');
    const bodyInput = this.querySelector('#body');
    const titleError = this.querySelector('#titleError');
    const bodyError = this.querySelector('#bodyError');

    if (!form || !titleInput || !bodyInput || !titleError || !bodyError) return;

    // Real-time validation for title
    titleInput.addEventListener('input', () => {
      if (titleInput.value.length < 5 && titleInput.value.length > 0) {
        titleError.style.display = 'block';
        titleInput.style.borderColor = '#e74c3c';
      } else {
        titleError.style.display = 'none';
        titleInput.style.borderColor = titleInput.value ? '#27ae60' : '#ffc6d0';
      }
    });

    // Real-time validation for body
    bodyInput.addEventListener('input', () => {
      if (bodyInput.value.length < 10 && bodyInput.value.length > 0) {
        bodyError.style.display = 'block';
        bodyInput.style.borderColor = '#e74c3c';
      } else {
        bodyError.style.display = 'none';
        bodyInput.style.borderColor = bodyInput.value ? '#27ae60' : '#ffc6d0';
      }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const title = titleInput.value.trim();
      const body = bodyInput.value.trim();

      let isValid = true;

      // Validate title
      if (title.length < 5) {
        titleError.style.display = 'block';
        titleInput.style.borderColor = '#e74c3c';
        isValid = false;
      }

      // Validate body
      if (body.length < 10) {
        bodyError.style.display = 'block';
        bodyInput.style.borderColor = '#e74c3c';
        isValid = false;
      }

      if (isValid) {
        try {
          showGlobalLoading();

          // Dispatch custom event for form submission
          this.dispatchEvent(new CustomEvent('noteSubmit', {
            bubbles: true,
            detail: { title, body }
          }));

          showToast('Catatan berhasil ditambahkan!', 'success');
          this.resetForm();
        } catch (error) {
          console.error('Error adding note:', error);
          showToast(`Gagal menambahkan catatan: ${error.message}`, 'error');
        } finally {
          hideGlobalLoading();
        }
      }
    });
  }
}

// Custom Element: Note Item
class NoteItem extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['note-title', 'note-body', 'note-date', 'note-id', 'note-archived'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      this.setupEventListeners();
    }
  }

  render() {
    const title = this.getAttribute('note-title') || 'No Title';
    const body = this.getAttribute('note-body') || 'No content';
    const date = this.getAttribute('note-date')
      ? new Date(this.getAttribute('note-date')).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';
    const isArchived = this.getAttribute('note-archived') === 'true';

    this.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
      <span class="note-date">Dibuat pada: ${escapeHtml(date)}</span>
      <div class="note-actions">
        <button class="action-btn archive-btn" title="${isArchived ? 'Aktifkan' : 'Arsipkan'}" aria-label="${isArchived ? 'Aktifkan catatan' : 'Arsipkan catatan'}">
          ${isArchived ? '📂' : '📁'}
        </button>
        <button class="action-btn delete-btn" title="Hapus" aria-label="Hapus catatan">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }

  setupEventListeners() {
    const archiveBtn = this.querySelector('.archive-btn');
    const deleteBtn = this.querySelector('.delete-btn');
    const noteId = this.getAttribute('note-id');

    if (archiveBtn) {
      archiveBtn.addEventListener('click', async () => {
        try {
          showGlobalLoading();
          const isArchived = this.getAttribute('note-archived') === 'true';

          // Dispatch custom event for archive toggle
          this.dispatchEvent(new CustomEvent('noteArchiveToggle', {
            bubbles: true,
            detail: { noteId, isArchived }
          }));

          showToast(
            `Catatan berhasil ${isArchived ? 'diaktifkan' : 'diarsipkan'}!`,
            'success'
          );
        } catch (error) {
          console.error('Error toggling archive:', error);
          showToast(`Gagal mengubah status arsip: ${error.message}`, 'error');
        } finally {
          hideGlobalLoading();
        }
      });
    }

    if (deleteBtn && noteId) {
      deleteBtn.addEventListener('click', () => {
        // Dispatch custom event for delete
        this.dispatchEvent(new CustomEvent('noteDelete', {
          bubbles: true,
          detail: noteId
        }));
      });
    }
  }
}

// Custom Element: Notes Grid
class NotesGrid extends HTMLElement {
  constructor() {
    super();
    this._notes = [];
    this._activeTab = 'active';
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  async loadNotes() {
    try {
      this.showLoading();
      
      // Dispatch event to load notes
      this.dispatchEvent(new CustomEvent('loadNotes', {
        bubbles: true,
        detail: { activeTab: this._activeTab }
      }));
    } catch (error) {
      console.error('Error loading notes:', error);
      showToast(`Gagal memuat catatan: ${error.message}`, 'error');
      this.showEmptyState();
    }
  }

  showLoading() {
    const loadingElement = this.querySelector('.loading-indicator');
    if (loadingElement) {
      loadingElement.style.display = 'block';
    }

    const notesContainer = this.querySelector('.notes-container');
    if (notesContainer) {
      notesContainer.style.display = 'none';
    }

    const emptyState = this.querySelector('.empty-state');
    if (emptyState) {
      emptyState.style.display = 'none';
    }
  }

  hideLoading() {
    const loadingElement = this.querySelector('.loading-indicator');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    const notesContainer = this.querySelector('.notes-container');
    if (notesContainer) {
      notesContainer.style.display = 'grid';
    }
  }

  showEmptyState() {
    const emptyState = this.querySelector('.empty-state');
    if (emptyState) {
      emptyState.style.display = 'block';
    }

    const notesContainer = this.querySelector('.notes-container');
    if (notesContainer) {
      notesContainer.style.display = 'none';
    }
  }

  setActiveTab(tab) {
    this._activeTab = tab;
    this.loadNotes();
  }

  setNotes(notes) {
    this._notes = notes;
    this.render();
    this.hideLoading();
  }

  render() {
    // Filter notes based on active tab
    const filteredNotes = this._activeTab === 'active'
      ? this._notes.filter(note => !note.archived)
      : this._notes.filter(note => note.archived);

    if (filteredNotes.length === 0) {
      this.innerHTML = `
        <h2><i class="fas fa-list"></i> ${this._activeTab === 'active' ? 'Catatan Aktif' : 'Catatan Diarsipkan'}</h2>
        <div class="loading-indicator" style="display: none;">
          <div class="loading-spinner"></div>
          <p>Memuat catatan...</p>
        </div>
        <div class="empty-state">
          <div><i class="fas fa-sticky-note"></i></div>
          <p>${
            this._activeTab === 'active'
              ? 'Belum ada catatan. Yuk buat catatan pertama!'
              : 'Tidak ada catatan yang diarsipkan.'
          }</p>
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <h2><i class="fas fa-list"></i> ${this._activeTab === 'active' ? 'Catatan Aktif' : 'Catatan Diarsipkan'} (${filteredNotes.length})</h2>
      <div class="loading-indicator" style="display: none;">
        <div class="loading-spinner"></div>
        <p>Memuat catatan...</p>
      </div>
      <div class="notes-container">
        ${filteredNotes
          .map(
            note => `
          <note-item 
            note-title="${escapeHtml(note.title)}" 
            note-body="${escapeHtml(note.body)}" 
            note-date="${note.createdAt}"
            note-id="${note.id}"
            note-archived="${note.archived}"
          ></note-item>
        `
          )
          .join('')}
      </div>
    `;
  }

  setupEventListeners() {
    // Listen for custom events from note items
    this.addEventListener('noteArchiveToggle', async (e) => {
      const { noteId, isArchived } = e.detail;
      try {
        showGlobalLoading();
        
        if (isArchived) {
          await unarchiveNote(noteId);
        } else {
          await archiveNote(noteId);
        }
        
        // Reload notes
        this.loadNotes();
      } catch (error) {
        console.error('Error toggling archive:', error);
        showToast(`Gagal mengubah status arsip: ${error.message}`, 'error');
      } finally {
        hideGlobalLoading();
      }
    });

    this.addEventListener('noteDelete', async (noteId) => {
      const modal = document.getElementById('deleteModal');
      const confirmDelete = document.getElementById('confirmDelete');
      const cancelDelete = document.getElementById('cancelDelete');
      const closeModal = document.querySelector('.close-modal');

      if (modal) {
        modal.style.display = 'flex';

        const deleteHandler = async () => {
          try {
            showGlobalLoading();
            await deleteNote(noteId);
            
            // Reload notes
            this.loadNotes();
            showToast('Catatan berhasil dihapus!', 'success');
          } catch (error) {
            console.error('Error deleting note:', error);
            showToast(`Gagal menghapus catatan: ${error.message}`, 'error');
          } finally {
            hideGlobalLoading();
            if (modal) modal.style.display = 'none';
            
            // Remove event listeners
            if (confirmDelete) confirmDelete.removeEventListener('click', deleteHandler);
            if (cancelDelete) cancelDelete.removeEventListener('click', cancelHandler);
            if (closeModal) closeModal.removeEventListener('click', cancelHandler);
          }
        };

        const cancelHandler = () => {
          if (modal) modal.style.display = 'none';
          
          // Remove event listeners
          if (confirmDelete) confirmDelete.removeEventListener('click', deleteHandler);
          if (cancelDelete) cancelDelete.removeEventListener('click', cancelHandler);
          if (closeModal) closeModal.removeEventListener('click', cancelHandler);
        };

        if (confirmDelete) confirmDelete.addEventListener('click', deleteHandler);
        if (cancelDelete) cancelDelete.addEventListener('click', cancelHandler);
        if (closeModal) closeModal.addEventListener('click', cancelHandler);
      }
    });
  }
}

// Export custom elements
export { AppHeader, NoteForm, NoteItem, NotesGrid };
