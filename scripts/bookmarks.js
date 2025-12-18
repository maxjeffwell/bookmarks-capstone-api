'use strict';
/* global $, store, api, security */
// eslint-disable-next-line no-unused-vars

const bookmarkList = (function() {
  const renderAuthUI = function() {
    const user = auth.getCurrentUser();
    
    if (user) {
      return `
        <div class="auth-container">
          <span class="user-email">${security.escapeHtml(user.email)}</span>
          <button class="js-sign-out btn-secondary">Sign Out</button>
        </div>
      `;
    } else {
      return `
        <div class="auth-container">
          <div class="auth-form hidden" id="auth-form">
            <input type="email" id="auth-email" placeholder="Email" class="form-control" required>
            <input type="password" id="auth-password" placeholder="Password" class="form-control" required>
            <div class="auth-buttons">
              <button class="js-sign-in btn-secondary">Sign In</button>
              <button class="js-sign-up btn-secondary">Sign Up</button>
              <button class="js-google-sign-in btn-secondary">Sign in with Google</button>
            </div>
            <button class="js-forgot-password btn-link">Forgot password?</button>
          </div>
          <button class="js-show-auth btn-primary" id="show-auth-btn">Sign In / Sign Up</button>
        </div>
      `;
    }
  };
  
  const renderInput = function() {
    const generateTagOptions = function() {
      const allTags = new Set();
      store.bookmarks.forEach(bookmark => {
        if (bookmark.tags && Array.isArray(bookmark.tags)) {
          bookmark.tags.forEach(tag => allTags.add(tag));
        }
      });
      
      return Array.from(allTags).sort().map(tag => 
        `<option value="${security.escapeHtml(tag)}">${security.escapeHtml(tag)}</option>`
      ).join('');
    };

    const generateInputControl = function() {
      const isAdding = store.adding;
      return `
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div class="flex flex-wrap items-center gap-3">
            <button class="js-create-bookmark btn btn-primary firebase-glow" aria-controls="new-bookmark-form" aria-expanded="${isAdding}" aria-label="Add new bookmark" data-tooltip="Create a new bookmark">
              <span style="font-size: 18px;">🔥</span> Add Bookmark
            </button>
            <button class="js-theme-toggle btn btn-secondary" aria-label="Toggle dark mode" data-tooltip="Toggle theme">
              <span style="font-size: 16px;">🌙</span>
            </button>
            <button class="js-export-bookmarks btn" aria-label="Export bookmarks" data-tooltip="Export your bookmarks">
              <span style="font-size: 16px;">📤</span> Export
            </button>
            <button class="js-bulk-toggle btn" aria-label="Toggle bulk selection" data-tooltip="Select multiple bookmarks">
              <span style="font-size: 16px;">☑️</span> Bulk Select
            </button>
          </div>
          
          <div class="flex flex-wrap items-center gap-3">
            <input type="text" id="search-bookmarks" class="form-control" style="min-width: 200px;" placeholder="Search bookmarks..." aria-label="Search bookmarks by title or description">
            
            <select id="filter-bookmarks" class="form-control" style="min-width: 160px;" aria-label="Filter bookmarks by rating">
              <option value="" selected disabled hidden>Filter by Rating</option>
              <option value="0">All Ratings</option>
              <option value="5">5 stars</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
              <option value="2">2+ stars</option>
              <option value="1">1+ star</option>
            </select>
            
            <select id="filter-tags" class="form-control" style="min-width: 140px;" aria-label="Filter bookmarks by tag">
              <option value="">All Tags</option>
              ${generateTagOptions()}
            </select>
          </div>
        </div>
      `;
    };
    const generateForm = function() {
      const hiddenIfNotAdding = (store.adding) ? '' : 'hidden';

      const generateError = function() {
        let toast = '';

        if (store.error) {
          const isFirebaseBlocked = store.error.includes('blocked') || store.error.includes('ad blocker');
          const helpLink = isFirebaseBlocked ? 
            `<br><small><a href="ADBLOCKER_HELP.md" target="_blank" class="underline text-red-600 hover:text-red-800">📖 View troubleshooting guide</a></small>` : '';
          
          toast = `
            <div class="firebase-alert firebase-alert-error firebase-animate-in" role="alert">
              <div class="flex items-start justify-between w-full">
                <div class="flex items-start gap-3">
                  <span style="font-size: 20px;">🚨</span>
                  <div>
                    <p>${security.escapeHtml(store.error)}</p>
                    ${helpLink}
                  </div>
                </div>
                <button id="cancel-error" class="btn-icon" style="color: #C62828; background: none; border: none; padding: 4px;" aria-label="Close error message" data-tooltip="Close error">×</button>
              </div>
            </div>
          `;
        }
        return toast;
      };

      return `
        <div id="new-bookmark-form" class="firebase-workspace firebase-animate-in ${hiddenIfNotAdding}">
          <form id="new-bookmark" class="space-y-6">
            <div class="firebase-workspace-header">
              <h2 class="firebase-workspace-title">🔥 Create a New Bookmark</h2>
              <div class="flex items-center gap-3">
                <input type="file" id="import-bookmarks" class="js-import-bookmarks" accept=".json" style="display: none;">
                <button type="button" class="js-import-button btn btn-secondary" aria-label="Import bookmarks" data-tooltip="Import bookmarks from JSON">
                  <span style="font-size: 16px;">📂</span> Import
                </button>
              </div>
            </div>
            
            ${generateError()}
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="new-title" class="firebase-label">📝 Title</label>
                <input type="text" name="title" id="new-title" class="firebase-input js-autosave" placeholder="Enter bookmark title" required>
              </div>
              
              <div>
                <label for="new-url" class="firebase-label">🔗 URL</label>
                <input type="url" name="url" id="new-url" class="firebase-input js-autosave" placeholder="https://example.com" required>
              </div>
            </div>
            
            <div class="firebase-form-section">
              <label class="firebase-label">⭐ Rating</label>
              <fieldset class="star-rating-group">
                <legend class="sr-only">Choose a rating</legend>
                <div class="flex items-center gap-2" style="padding: 12px 0;">
                  ${[1,2,3,4,5].map(rating => `
                    <label class="star-label" for="new-bookmark-${rating}" data-tooltip="${rating} star${rating > 1 ? 's' : ''}" style="cursor: pointer;">
                      <input type="radio" value="${rating}" id="new-bookmark-${rating}" name="rating" class="sr-only star-input">
                      <span class="star-icon" data-rating="${rating}" style="font-size: 28px; color: var(--firebase-text-disabled); transition: var(--firebase-transition-fast);">★</span>
                      <span class="sr-only">${rating} star${rating > 1 ? 's' : ''}</span>
                    </label>
                  `).join('')}
                </div>
              </fieldset>
            </div>
            
            <div>
              <label for="new-description" class="firebase-label">💬 Description</label>
              <textarea name="desc" id="new-description" class="firebase-input js-autosave" rows="3" placeholder="Optional description" style="resize: vertical;"></textarea>
            </div>
            
            <div>
              <label for="new-tags" class="firebase-label">🏷️ Tags</label>
              <input type="text" name="tags" id="new-tags" class="firebase-input js-autosave" placeholder="work, productivity, tools (comma-separated)">
            </div>
            
            <div class="firebase-divider"></div>
            <div class="flex items-center justify-end gap-3 pt-4">
              <button type="button" class="js-new-bm-cancel btn btn-secondary" data-tooltip="Cancel and close form">
                <span style="font-size: 16px;">❌</span> Cancel
              </button>
              <button type="submit" class="js-create-bm-submit btn btn-primary firebase-glow" data-tooltip="Save this bookmark">
                <span style="font-size: 16px;">🔥</span> Create Bookmark
              </button>
            </div>
          </form>
        </div>
      `;
    };

    let html = '';
    html += renderAuthUI();
    html += generateInputControl();
    html += generateForm();
    $('.main-section').html(html);
  };

  const renderBookmarkList = function() {
    let bookmarks = store.bookmarks;
    let filteredBookmarks = bookmarks.filter(bookmark => bookmark.rating >= store.filter);
    
    if (store.searchTerm) {
      const searchTerm = store.searchTerm.toLowerCase();
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        (bookmark.title && bookmark.title.toLowerCase().includes(searchTerm)) || 
        (bookmark.desc && bookmark.desc.toLowerCase().includes(searchTerm)) ||
        (bookmark.tags && Array.isArray(bookmark.tags) && bookmark.tags.some(tag => tag && tag.toLowerCase().includes(searchTerm)))
      );
    }

    if (store.selectedTag) {
      filteredBookmarks = filteredBookmarks.filter(bookmark => 
        bookmark.tags && Array.isArray(bookmark.tags) && bookmark.tags.includes(store.selectedTag)
      );
    }

    const generateRating = function(item) {
      switch (item.rating) {
      case 5:
        return '5 Stars';
      case 4:
        return '4 Stars';
      case 3:
        return '3 Stars';
      case 2:
        return '2 Stars';
      case 1:
        return '1 Star';
      default:
        return 'No Stars';
      }
    };


    const generateEditForm = function(bookmark) {
      const safeTitle = security.escapeHtml(bookmark.title);
      const safeUrl = security.sanitizeUrl(bookmark.url);
      const safeDesc = security.escapeHtml(bookmark.desc || '');
      
      return `
        <form class="edit-bookmark-form" data-bookmark-id="${bookmark.id}">
          <div class="row">
            <div class="col-8">
              <label for="edit-title-${bookmark.id}">Title</label>
              <input type="text" id="edit-title-${bookmark.id}" name="title" value="${safeTitle}" required>
            </div>
          </div>
          <div class="row">
            <div class="col-8">
              <label for="edit-url-${bookmark.id}">URL</label>
              <input type="url" id="edit-url-${bookmark.id}" name="url" value="${safeUrl}" required>
            </div>
          </div>
          <div class="row">
            <div class="col-8">
              <label for="edit-desc-${bookmark.id}">Description</label>
              <textarea id="edit-desc-${bookmark.id}" name="desc">${safeDesc}</textarea>
            </div>
          </div>
          <div class="row">
            <div class="col-8">
              <label for="edit-tags-${bookmark.id}">Tags (comma-separated)</label>
              <input type="text" id="edit-tags-${bookmark.id}" name="tags" value="${security.escapeHtml((bookmark.tags || []).join(', '))}">
            </div>
          </div>
          <div class="row">
            <div class="col-8">
              <fieldset class="star-ratings">
                <legend>Rating</legend>
                ${[1,2,3,4,5].map(rating => `
                  <input type="radio" value="${rating}" id="edit-rating-${bookmark.id}-${rating}" name="rating" ${bookmark.rating === rating ? 'checked' : ''}>
                  <label for="edit-rating-${bookmark.id}-${rating}" class="star-rating">${rating} star${rating > 1 ? 's' : ''}</label>
                `).join('')}
              </fieldset>
            </div>
          </div>
          <div class="row">
            <div class="col-8">
              <button type="submit" class="btn-save">Save</button>
              <button type="button" class="btn-cancel-edit">Cancel</button>
            </div>
          </div>
        </form>
      `;
    };

    const generateBookmarkStr = function(bookmark) {
      const description = security.escapeHtml(bookmark.desc || '');
      const hiddenIfNotExpanded = (!bookmark.expanded) ? 'hidden' : '';
      const expandedToggle = (!bookmark.expanded) ? '<span class="fas circle" aria-hidden="true"></span><span class="visually-hidden">Collapsed</span>': '<span class="fas circle" aria-hidden="true"></span><span class="visually-hidden">Expanded</span>';
      const safeUrl = security.sanitizeUrl(bookmark.url);
      const safeTitle = security.escapeHtml(bookmark.title);
      const bookmarkId = security.escapeHtml(bookmark.id);
      
      const getFaviconUrl = function(url) {
        try {
          const domain = new URL(url).hostname;
          return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
        } catch (e) {
          return '';
        }
      };
      
      const faviconUrl = getFaviconUrl(safeUrl);
      const faviconImg = faviconUrl ? `<img src="${faviconUrl}" alt="" class="favicon" onerror="this.style.display='none'">` : '';

      return `
        <li class="js-bookmark-element firebase-card bookmark-card firebase-animate-in" role="listitem" data-item-id="${bookmarkId}" draggable="true">
          <article class="bookmark-card-content ${store.selectedBookmarks.includes(String(bookmarkId)) ? 'bookmark-selected' : ''}">
            ${store.bulkMode ? `
              <div class="bulk-select-checkbox">
                <input type="checkbox" class="js-bulk-checkbox" data-bookmark-id="${bookmarkId}" aria-label="Select ${safeTitle}" ${store.selectedBookmarks.includes(String(bookmarkId)) ? 'checked' : ''}>
              </div>
            ` : ''}
            
            <header class="bookmark-header">
              <button class="js-bookmark-title-clickable bookmark-title-btn" aria-expanded="${bookmark.expanded}" aria-controls="details-${bookmarkId}">
                <div class="flex items-center gap-3">
                  ${faviconImg}
                  <h3 class="bookmark-title-text">${safeTitle}</h3>
                  <span class="bookmark-expand-icon ${bookmark.expanded ? 'expanded' : ''}">${bookmark.expanded ? '▼' : '▶'}</span>
                </div>
              </button>
              
              <div class="bookmark-rating">
                <div class="flex items-center gap-1" data-tooltip="Rating: ${bookmark.rating}/5 stars">
                  ${Array.from({length: 5}, (_, i) => 
                    `<span class="star ${i < bookmark.rating ? 'filled' : 'empty'}" style="color: ${i < bookmark.rating ? 'var(--firebase-orange)' : 'var(--firebase-text-disabled)'}; font-size: 16px;">★</span>`
                  ).join('')}
                  <span class="rating-text" style="margin-left: 8px; font-size: 14px; color: var(--firebase-text-secondary);">${bookmark.rating}/5</span>
                </div>
              </div>
            </header>

            <div id="details-${bookmarkId}" class="bookmark-details ${hiddenIfNotExpanded}" role="region" aria-labelledby="details-heading-${bookmarkId}">
              <h4 id="details-heading-${bookmarkId}" class="sr-only">Details for ${safeTitle}</h4>
              
              ${store.editingId === bookmarkId ? generateEditForm(bookmark) : `
                ${description ? `<p class="bookmark-description">${description}</p>` : ''}
                
                ${(bookmark.tags && Array.isArray(bookmark.tags) && bookmark.tags.length > 0) ? `
                  <div class="bookmark-tags">
                    ${Array.isArray(bookmark.tags) ? bookmark.tags.map(tag => `<span class="tag">${security.escapeHtml(tag)}</span>`).join('') : ''}
                  </div>
                ` : ''}
                
                <div class="bookmark-actions">
                  <a class="js-site-link btn btn-primary" href="${safeUrl}" target="_blank" rel="noopener noreferrer">
                    🔗 Visit Site
                  </a>
                  <button class="btn-edit btn" aria-label="Edit ${safeTitle} bookmark">✏️ Edit</button>
                  <button class="btn-delete btn btn-danger" aria-label="Delete ${safeTitle} bookmark">🗑️ Delete</button>
                </div>
              `}
            </div>
          </article>
        </li>
      `;
    };

    const generateBookmarkListStr = function(bookmarks) {
      let listString = '';

      bookmarks.forEach(bookmark => {
        listString += generateBookmarkStr(bookmark);
      });

      return listString;
    };

    const generateBulkActions = function() {
      if (!store.bulkMode) return '';
      
      return `
        <div class="bulk-actions-footer-bar firebase-card">
          <div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center gap-3">
              <span class="firebase-label firebase-text-orange">Bulk Selection Mode</span>
              <span class="firebase-body-small firebase-text-secondary">${store.selectedBookmarks.length} selected</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="js-bulk-select-all firebase-btn firebase-btn-primary text-sm">
                ${store.selectedBookmarks.length === store.bookmarks.length ? 'Deselect All' : 'Select All'}
              </button>
              <button class="js-bulk-delete firebase-btn text-sm" style="background: var(--firebase-red); color: white; border-color: var(--firebase-red);">Delete Selected</button>
              <button class="js-bulk-export firebase-btn firebase-btn-secondary text-sm">Export Selected</button>
            </div>
          </div>
        </div>
      `;
    };

    let bookmarkListHtml = '';
    bookmarkListHtml += generateBookmarkListStr(filteredBookmarks);

    $('.bookmark-list').html(bookmarkListHtml);
    
    // Render bulk actions in footer
    $('.bulk-actions-footer').html(generateBulkActions());
  };

  const render = function() {
    renderInput();
    renderBookmarkList();
  };

  const handleNewSubmit = function() {
    $('.main-section').on('submit', '#new-bookmark', function(event) {
      event.preventDefault();

      const newBookmark = $(event.target).serializeJSON();
      
      // Process tags
      if (newBookmark.tags) {
        newBookmark.tags = newBookmark.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
      
      // Check for duplicates
      const isDuplicate = store.bookmarks.some(bookmark => 
        (bookmark.url && newBookmark.url && bookmark.url.toLowerCase() === newBookmark.url.toLowerCase()) ||
        (bookmark.title && newBookmark.title && bookmark.title.toLowerCase() === newBookmark.title.toLowerCase())
      );
      
      if (isDuplicate) {
        store.setError('A bookmark with this URL or title already exists.');
        render();
        return;
      }

      const onSuccess = function(returnedBookmark) {
        store.addBookmark(returnedBookmark);
        store.toggleAdding();
        store.setError(null);
        store.clearDraft(); // Clear saved draft after successful submission
        render();
        $('.js-create-bookmark').attr('aria-expanded', store.adding);
        
        // Track analytics event
        if (window.analyticsTracker) {
          window.analyticsTracker.trackBookmarkCreated();
        }
      };

      const onError = function(err) {
        store.setError(err.responseJSON.message);
        render();
      };

      api.createBookmark(newBookmark, onSuccess, onError);
    });
  };

  const handleErrCancelClick = function() {
    $('.main-section').on('click', '#cancel-error', function(event) {
      event.preventDefault();
      store.setError(null);
      render();
    });
  };

  const handleDeleteClicked = function() {
    $('.bookmark-list').on('click', '.btn-delete', function(event) {
      event.preventDefault();

      const currentId = $(event.target).closest('li').attr('data-item-id');
      const bookmark = store.bookmarks.find(b => b.id === currentId);
      
      if (bookmark && confirm(`Are you sure you want to delete "${bookmark.title}"?`)) {
        const onSuccess = function() {
          store.findAndDelete(currentId);
          render();
          
          // Track analytics event
          if (window.analyticsTracker) {
            window.analyticsTracker.trackBookmarkDeleted();
          }
        };

        api.deleteBookmark(currentId, onSuccess);
      }
    });
  };

  const handleItemClicked = function() {
    $('.bookmark-list').on('click', '.js-bookmark-title-clickable', function(event) {
      event.preventDefault();
      const currentId = $(event.target).closest('li').attr('data-item-id');
      const bookmark = store.bookmarks.find(b => b.id === currentId);
      if (bookmark) {
        store.toggleBookmarkExpanded(currentId);
        render();
        $(this).attr('aria-expanded', !bookmark.expanded);
        
        // Track analytics event
        if (window.analyticsTracker) {
          window.analyticsTracker.trackBookmarkExpanded();
        }
      }
    });
  };

  const handleAddClicked = function() {
    $('.main-section').on('click', '.js-create-bookmark', function(event) {
      event.preventDefault();
      store.toggleAdding();
      render();
      $(this).attr('aria-expanded', store.adding);
      
      // Load draft data after form is rendered
      if (store.adding) {
        setTimeout(loadDraftData, 100);
      }
    });
  };

  const handleCancel = function() {
    $('.main-section').on('click', '.js-new-bm-cancel', function(event) {
      event.preventDefault();
      
      // Check if form has content before asking for confirmation
      const hasContent = $('#new-title').val() || $('#new-url').val() || 
                        $('#new-description').val() || $('#new-tags').val();
      
      if (hasContent && !confirm('Discard unsaved changes?')) {
        return;
      }
      
      store.clearDraft();
      store.toggleAdding();
      render();
      $('.js-create-bookmark').attr('aria-expanded', store.adding);
    });
  };

  const handleFilter = function() {
    $('.main-section').on('change', '#filter-bookmarks', function(event) {
      const filterValue = $(event.target).val();

      store.setFilter(filterValue);
      render();
      
      // Track analytics event
      if (window.analyticsTracker) {
        window.analyticsTracker.trackFilterUsed(filterValue);
      }
    });
  };

  const handleSearch = function() {
    $('.main-section').on('input', '#search-bookmarks', function(event) {
      const searchTerm = $(event.target).val();

      store.setSearchTerm(searchTerm);
      render();
    });
  };

  const handleEditClicked = function() {
    $('.bookmark-list').on('click', '.btn-edit', function(event) {
      event.preventDefault();
      const currentId = $(event.target).closest('li').attr('data-item-id');
      
      store.setEditingId(currentId);
      render();
    });
  };

  const handleEditCancel = function() {
    $('.bookmark-list').on('click', '.btn-cancel-edit', function(event) {
      event.preventDefault();
      
      if (confirm('Discard changes to this bookmark?')) {
        store.setEditingId(null);
        render();
      }
    });
  };

  const handleEditSubmit = function() {
    $('.bookmark-list').on('submit', '.edit-bookmark-form', function(event) {
      event.preventDefault();
      
      const bookmarkId = $(event.target).attr('data-bookmark-id');
      const updatedBookmark = $(event.target).serializeJSON();
      
      // Process tags
      if (updatedBookmark.tags) {
        updatedBookmark.tags = updatedBookmark.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
      
      const onSuccess = function(returnedBookmark) {
        store.updateBookmark(bookmarkId, returnedBookmark);
        store.setEditingId(null);
        store.setError(null);
        render();
      };

      const onError = function(err) {
        store.setError(err.responseJSON.message);
        render();
      };

      api.updateBookmark(bookmarkId, updatedBookmark, onSuccess, onError);
    });
  };

  const handleThemeToggle = function() {
    $('.main-section').on('click', '.js-theme-toggle', function(event) {
      event.preventDefault();
      store.toggleDarkMode();
      $(this).text(store.darkMode ? '☀️' : '🌙');
    });
  };

  const handleDragStart = function() {
    $('.bookmark-list').on('dragstart', '.js-bookmark-element', function(event) {
      event.originalEvent.dataTransfer.setData('text/plain', $(this).attr('data-item-id'));
      $(this).addClass('dragging');
    });
  };

  const handleDragEnd = function() {
    $('.bookmark-list').on('dragend', '.js-bookmark-element', function(event) {
      $(this).removeClass('dragging');
    });
  };

  const handleDragOver = function() {
    $('.bookmark-list').on('dragover', '.js-bookmark-element', function(event) {
      event.preventDefault();
      $(this).addClass('drag-over');
    });
  };

  const handleDragLeave = function() {
    $('.bookmark-list').on('dragleave', '.js-bookmark-element', function(event) {
      $(this).removeClass('drag-over');
    });
  };

  const handleDrop = function() {
    $('.bookmark-list').on('drop', '.js-bookmark-element', function(event) {
      event.preventDefault();
      const draggedId = event.originalEvent.dataTransfer.getData('text/plain');
      const targetId = $(this).attr('data-item-id');
      
      if (draggedId !== targetId) {
        const draggedIndex = store.bookmarks.findIndex(b => b.id === draggedId);
        const targetIndex = store.bookmarks.findIndex(b => b.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          store.reorderBookmarks(draggedIndex, targetIndex);
          render();
        }
      }
      
      $('.js-bookmark-element').removeClass('drag-over');
    });
  };

  const handleExport = function() {
    $('.main-section').on('click', '.js-export-bookmarks', function(event) {
      event.preventDefault();
      
      const exportData = {
        bookmarks: store.bookmarks,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const handleImportButton = function() {
    $('.main-section').on('click', '.js-import-button', function(event) {
      event.preventDefault();
      $('#import-bookmarks').click();
    });
  };

  const handleTagFilter = function() {
    $('.main-section').on('change', '#filter-tags', function(event) {
      const selectedTag = $(event.target).val();
      store.setSelectedTag(selectedTag);
      render();
    });
  };

  const handleBulkToggle = function() {
    $('.main-section').on('click', '.js-bulk-toggle', function(event) {
      event.preventDefault();
      store.toggleBulkMode();
      render();
    });
  };

  const handleBulkCheckbox = function() {
    $('.bookmark-list').on('change', '.js-bulk-checkbox', function(event) {
      const bookmarkId = $(event.target).attr('data-bookmark-id');
      store.toggleBookmarkSelection(bookmarkId);
      render();
    });
  };

  const handleBulkSelectAll = function() {
    $('.bulk-actions-footer').on('click', '.js-bulk-select-all', function(event) {
      event.preventDefault();
      
      // Toggle between select all and deselect all
      if (store.selectedBookmarks.length === store.bookmarks.length) {
        store.selectedBookmarks = []; // Deselect all
      } else {
        store.selectAllBookmarks(); // Select all
      }
      
      console.log('Selected bookmarks:', store.selectedBookmarks); // Debug
      render();
    });
  };

  const handleBulkDelete = function() {
    $('.bulk-actions-footer').on('click', '.js-bulk-delete', function(event) {
      event.preventDefault();
      if (store.selectedBookmarks.length > 0) {
        if (confirm(`Delete ${store.selectedBookmarks.length} selected bookmark(s)?`)) {
          store.deleteSelectedBookmarks();
          render();
        }
      }
    });
  };

  const handleBulkExport = function() {
    $('.bulk-actions-footer').on('click', '.js-bulk-export', function(event) {
      event.preventDefault();
      if (store.selectedBookmarks.length > 0) {
        const selectedBookmarks = store.bookmarks.filter(b => store.selectedBookmarks.includes(b.id));
        const exportData = {
          bookmarks: selectedBookmarks,
          exportDate: new Date().toISOString(),
          version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `selected-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleAutoSave = function() {
    let autoSaveTimeout;
    
    $('.main-section').on('input', '.js-autosave', function() {
      clearTimeout(autoSaveTimeout);
      
      autoSaveTimeout = setTimeout(() => {
        const formData = {
          title: $('#new-title').val(),
          url: $('#new-url').val(),
          desc: $('#new-description').val(),
          tags: $('#new-tags').val()
        };
        
        // Only save if there's actual content
        if (formData.title || formData.url || formData.desc || formData.tags) {
          store.saveDraft(formData);
        }
      }, 1000); // Auto-save after 1 second of inactivity
    });
  };

  const loadDraftData = function() {
    const draft = store.loadDraft();
    if (draft) {
      $('#new-title').val(draft.title || '');
      $('#new-url').val(draft.url || '');
      $('#new-description').val(draft.desc || '');
      $('#new-tags').val(draft.tags || '');
    }
  };

  const handleImport = function() {
    $('.main-section').on('change', '.js-import-bookmarks', function(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importData = JSON.parse(e.target.result);
          const importedBookmarks = importData.bookmarks || importData;
          
          if (Array.isArray(importedBookmarks)) {
            importedBookmarks.forEach(bookmark => {
              const isDuplicate = store.bookmarks.some(existing => 
                existing.url && bookmark.url && existing.url.toLowerCase() === bookmark.url.toLowerCase()
              );
              
              if (!isDuplicate) {
                store.addBookmark({ ...bookmark, id: bookmark.id || Date.now().toString() });
              }
            });
            
            render();
            store.setError(`Successfully imported ${importedBookmarks.length} bookmarks.`);
          } else {
            store.setError('Invalid bookmark file format.');
          }
        } catch (error) {
          store.setError('Error reading bookmark file.');
        }
        
        render();
        event.target.value = '';
      };
      
      reader.readAsText(file);
    });
  };

  // Helper function to manage active auth button states
  const setActiveAuthButton = function(activeButtonClass) {
    // Reset all auth buttons to secondary state
    $('.js-sign-in, .js-sign-up, .js-google-sign-in')
      .removeClass('btn-primary')
      .addClass('btn-secondary');
    
    // Set the clicked button to primary state
    $(activeButtonClass)
      .removeClass('btn-secondary')
      .addClass('btn-primary');
  };

  const handleAuthEvents = function() {
    // Show/hide auth form
    $('.main-section').on('click', '.js-show-auth', function() {
      $('#auth-form').removeClass('hidden');
      $('#show-auth-btn').addClass('hidden');
      $('#auth-email').focus();
    });
    
    // Add direct click handler for forgot password button as backup
    $(document).on('click', '.js-forgot-password', function(event) {
      event.preventDefault();
      console.log('Direct forgot password handler triggered');
      const email = $('#auth-email').val();
      
      if (!email) {
        store.setError('Please enter your email address');
        render();
        return;
      }
      
      auth.sendPasswordResetEmail(email)
        .then(() => {
          store.setError('Password reset email sent. Check your inbox.');
          render();
        })
        .catch(error => {
          store.setError(error.message);
          render();
        });
    });
    
    // Sign in
    $('.main-section').on('click', '.js-sign-in', function(event) {
      event.preventDefault();
      setActiveAuthButton('.js-sign-in');
      const email = $('#auth-email').val();
      const password = $('#auth-password').val();
      
      if (!email || !password) {
        store.setError('Please enter email and password');
        render();
        return;
      }
      
      auth.signInWithEmail(email, password)
        .then(() => {
          const authForm = $('#auth-form')[0];
          if (authForm && typeof authForm.reset === 'function') {
            authForm.reset();
          }
          render();
        })
        .catch(error => {
          store.setError(error.message);
          render();
        });
    });
    
    // Sign up
    $('.main-section').on('click', '.js-sign-up', function(event) {
      event.preventDefault();
      setActiveAuthButton('.js-sign-up');
      const email = $('#auth-email').val();
      const password = $('#auth-password').val();
      
      if (!email || !password) {
        store.setError('Please enter email and password');
        render();
        return;
      }
      
      auth.signUpWithEmail(email, password)
        .then(() => {
          const authForm = $('#auth-form')[0];
          if (authForm && typeof authForm.reset === 'function') {
            authForm.reset();
          }
          render();
        })
        .catch(error => {
          store.setError(error.message);
          render();
        });
    });
    
    // Google sign in
    $('.main-section').on('click', '.js-google-sign-in', function(event) {
      event.preventDefault();
      setActiveAuthButton('.js-google-sign-in');
      auth.signInWithGoogle()
        .then(() => {
          render();
        })
        .catch(error => {
          store.setError(error.message);
          render();
        });
    });
    
    // Sign out
    $('.main-section').on('click', '.js-sign-out', function(event) {
      event.preventDefault();
      auth.signOut()
        .then(() => {
          store.bookmarks = [];
          render();
        })
        .catch(error => {
          store.setError(error.message);
          render();
        });
    });
    
    // Forgot password
    $('.main-section').on('click', '.js-forgot-password', function(event) {
      event.preventDefault();
      console.log('Forgot password clicked'); // Debug log
      const email = $('#auth-email').val();
      console.log('Email:', email); // Debug log
      
      if (!email) {
        store.setError('Please enter your email address');
        render();
        return;
      }
      
      auth.sendPasswordResetEmail(email)
        .then(() => {
          store.setError('Password reset email sent. Check your inbox.');
          render();
        })
        .catch(error => {
          store.setError(error.message);
          render();
        });
    });
  };
  
  const bindEventListeners = function() {
    handleAuthEvents();
    handleNewSubmit();
    handleErrCancelClick();
    handleDeleteClicked();
    handleItemClicked();
    handleAddClicked();
    handleCancel();
    handleFilter();
    handleSearch();
    handleEditClicked();
    handleEditCancel();
    handleEditSubmit();
    handleThemeToggle();
    handleDragStart();
    handleDragEnd();
    handleDragOver();
    handleDragLeave();
    handleDrop();
    handleExport();
    handleImportButton();
    handleTagFilter();
    handleBulkToggle();
    handleBulkCheckbox();
    handleBulkSelectAll();
    handleBulkDelete();
    handleBulkExport();
    handleAutoSave();
    handleImport();
  };

  return {
    render, bindEventListeners
  };
}());
