'use strict';
/* global $, store, api, security */
// eslint-disable-next-line no-unused-vars

const bookmarkList = (function() {
  const renderInput = function() {
    const generateInputControl = function() {
      const isAdding = store.adding;
      return `
        <section class="row">
          <div class="col-5">
            <button class="js-create-bookmark create-bookmark" aria-controls="new-bookmark-form" aria-expanded="${isAdding}" aria-label="Add new bookmark">Add Bookmark</button>
          </div>
          <div class="col-5">
            <select id="filter-bookmarks" class="filter-bookmarks" aria-label="Filter bookmarks by rating">
              <option value="" selected disabled hidden>Sort By Bookmark Rating</option>
              <option value="0">Show All</option>
              <option value="5">5 stars</span></option>
              <option value="4">4 stars +</option>
              <option value="3">3 stars +</option>
              <option value="2">2 stars +</option>
              <option value="1">1 star +</option>
            </select>
          </div>
        </section>
      `;
    };
    const generateForm = function() {
      const hiddenIfNotAdding = (store.adding) ? '' : 'hidden';

      const generateError = function() {
        let toast = '';

        if (store.error) {
          toast = `
            <section class="col-7">
              <div class="error-message" role="alert">
                <button id="cancel-error" aria-label="Close error message">X</button>
                <p>${security.escapeHtml(store.error)}</p>
              </div>
            </section>
          `;
        }
        return toast;
      };

      return `
        <section id="new-bookmark-form" class="row ${hiddenIfNotAdding}">
          <div class="col-10" class="new-bookmark">
            <form id="new-bookmark" class="new-bookmark">
              <div class="row">
                <div class="col-8">
                  <h2>Create a Bookmark:</h2>
                </div>
                ${generateError()}
              </div>
              
              <div class="row">
                <div class="col-6 offset-3">
                  <label for="new-title">Title</label>
                  <input type="text" name="title" id="new-title" class="new-item-input" placeholder="Add a name" required>
                </div>
              </div>
              <div class="row">
                <div class="col-6 offset-3">
                  <label for="new-url">Url</label>
                  <input type="url" name="url" id="new-url" class="new-item-input" placeholder="https://..." required>
                </div>
              </div>
              <div class="row">
                <div class="col-6 offset-3">
                  <fieldset class="star-ratings" id="new-rating">
                    <legend>Rating</legend>
                    <input type="radio" value="1" id="new-bookmark-1" name="rating" form="new-bookmark">
                    <label for="new-bookmark-1" class="star-rating">1 star</label>
                    <input type="radio" value="2" id="new-bookmark-2" name="rating" form="new-bookmark">
                    <label for="new-bookmark-2" class="star-rating">2 stars</label>
                    <input type="radio" value="3" id="new-bookmark-3" name="rating" form="new-bookmark">
                    <label for="new-bookmark-3" class="star-rating">3 stars</label>
                    <input type="radio" value="4" id="new-bookmark-4" name="rating" form="new-bookmark">
                    <label for="new-bookmark-4" class="star-rating">4 stars</label>
                    <input type="radio" value="5" id="new-bookmark-5" name="rating" form="new-bookmark">
                    <label for="new-bookmark-5" class="star-rating">5 stars</label>
                  </fieldset>
                </div>
              </div>
              <div class="row">
                <div class="col-6 offset-3">
                  <label for="new-description">Bookmark Description</label>
                  <textarea name="desc" id="new-description" class="new-item-input new-description" placeholder="Description"></textarea>
                </div>
              </div>
              <div class="row">
                <div class="col-3 offset-3">
                  <button type="submit" class="js-create-bm-submit">Create</button>
                  <button type="button" class="js-new-bm-cancel">Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      `;
    };

    let html = '';
    html += generateInputControl();
    html += generateForm();
    $('.main-section').html(html);
  };

  const renderBookmarkList = function() {
    let bookmarks = store.bookmarks;
    let filteredBookmarks = bookmarks.filter(bookmark => bookmark.rating >= store.filter);

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
    }


    const generateBookmarkStr = function(bookmark) {
      const description = security.escapeHtml(bookmark.desc || '');
      const hiddenIfNotExpanded = (!bookmark.expanded) ? 'hidden' : '';
      const expandedToggle = (!bookmark.expanded) ? '<span class="fas circle" aria-hidden="true"></span><span class="visually-hidden">Collapsed</span>': '<span class="fas circle" aria-hidden="true"></span><span class="visually-hidden">Expanded</span>';
      const safeUrl = security.sanitizeUrl(bookmark.url);
      const safeTitle = security.escapeHtml(bookmark.title);
      const bookmarkId = security.escapeHtml(bookmark.id);

      return `
        return `
        return `
        <li class="js-bookmark-element bookmark-element" role="listitem" data-item-id="${bookmarkId}">
          <article>
            <button class="js-bookmark-title-clickable bookmark-title-clickable" aria-expanded="${bookmark.expanded}" aria-controls="details-${bookmarkId}">
              <div class="bookmark-title">
                <h3>${expandedToggle} ${safeTitle}</h3>
              </div>
            </button>
            <div id="details-${bookmarkId}" class="bookmark-details ${hiddenIfNotExpanded}" role="region" aria-labelledby="details-heading-${bookmarkId}">
              <h4 id="details-heading-${bookmarkId}" class="visually-hidden">Details for ${safeTitle}</h4>
              <p>${description}</p>
              <a class="js-site-link btn" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Visit Site</a>
            </div>
            <form class="js-bookmark-props bookmark-props" id="${bookmark.id}-form" aria-label="Bookmark properties for ${safeTitle}">
              <div class="row">
                <div class="col-6">
                  <p class="rating-display">${generateRating(bookmark)}</p>
                </div>
                <div class="col-3 offset-3">
                  <button class="far fa-trash-alt btn-delete" aria-label="Delete ${safeTitle} bookmark">Delete<span class="btn-label btn-label-delete visually-hidden">Delete ${safeTitle}</span></button>
                </div>
              </div>
            </form>
          </article>
        </li>
      `;
      `;
    };

    const generateBookmarkListStr = function(bookmarks) {
      let listString = '';

      bookmarks.forEach(bookmark => {
        listString += generateBookmarkStr(bookmark);
      });

      return listString;
    };

    let bookmarkListHtml = '';
    bookmarkListHtml += generateBookmarkListStr(filteredBookmarks);

    $('.bookmark-list').html(bookmarkListHtml);
  };

  const render = function() {
    renderInput();
    renderBookmarkList();
  };

  const handleNewSubmit = function() {
    $('.main-section').on('submit', '#new-bookmark', function(event) {
      event.preventDefault();

      const newBookmark = $(event.target).serializeJSON();
      $('#new-bookmark')[0].reset();

      const onSuccess = function(returnedBookmark) {
        store.addBookmark(returnedBookmark);
        store.toggleAdding();
        store.setError(null);
        render();
        $('.js-create-bookmark').attr('aria-expanded', store.adding);
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

      const onSuccess = function() {
        store.findAndDelete(currentId);
        render();
      };

      api.deleteBookmark(currentId, onSuccess);
    });
  };

  const hhandleItemClicked = function() {
    $('.bookmark-list').on('click', '.js-bookmark-title-clickable', function(event) {
      event.preventDefault();
      const currentId = $(event.target).closest('li').attr('data-item-id');
      const bookmark = store.bookmarks.find(b => b.id === currentId);
      if (bookmark) {
        store.toggleBookmarkExpanded(currentId);
        render();
        $(this).attr('aria-expanded', !bookmark.expanded);
      }
    });
  };

  const handleAddClicked = function() {
    $('.main-section').on('click', '.js-create-bookmark', function(event) {
      event.preventDefault();
      store.toggleAdding();
      render();
      $(this).attr('aria-expanded', store.adding);
    });
  };

  const handleCancel = function() {
    $('.main-section').on('click', '.js-new-bm-cancel', function(event) {
      event.preventDefault();
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
    });
  };

  const bindEventListeners = function() {
    handleNewSubmit();
    handleErrCancelClick();
    handleDeleteClicked();
    hhandleItemClicked();
    handleAddClicked();
    handleCancel();
    handleFilter();
  };

  return {
    render, bindEventListeners
  };
}());
