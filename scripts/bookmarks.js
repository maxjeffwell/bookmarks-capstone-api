'use strict';
/* global $, store, api */
// eslint-disable-next-line no-unused-vars

const bookmarkList = (function() {
  const renderInput = function() {
    const generateInputControl = function() {
      return `
        <div class="row">
          <div class="col-5">
            <button class="js-create-bookmark create-bookmark">Add A Bookmark</button>
          </div>
          <div class="col-5">
            <select id="filter-bookmarks" class="filter-bookmarks" title="Filter bookmarks">
              <option value="" selected disabled hidden>Min Rating</option>
              <option value="0">Show All</option>
              <option value="5">5 stars</span></option>
              <option value="4">4 stars +</option>
              <option value="3">3 stars +</option>
              <option value="2">2 stars +</option>
              <option value="1">1 star +</option>
            </select>
          </div>
        </div>
      `;
    };
    const generateForm = function() {
      const hiddenIfNotAdding = (store.adding) ? 'hidden' : '';
      
      const generateError = function() {
        let toast = '';

        if (store.error) {
          toast = `
            <div class="col-7">
              <section class="error-message" role="region">
                <button id="cancel-error">X</button>
                <p>${store.error}</p>
              </section>
            </div>
          `;
        }
        return toast;
      };

      return `
        <div class="row ${hiddenIfNotAdding}">
          <div class="col-10" class="new-bookmark">
            <form id="new-bookmark" class="new-bookmark">
              <div class="row">
                <div class="col-8">
                  <h2>Create a Bookmark:</h2>
                </div>
                ${generateError()}
              </div>
              
              <div class="row">
                <div class="col-8 offset-3">
                  <label for="new-title">Title</label>
                  <input type="text" name="title" id="new-title" class="new-item-input" placeholder="Add a name">
                </div>
              </div>
              <div class="row">
                <div class="col-6 offset-3">
                  <label for="new-url">Url</label>
                  <input type="text" name="url" id="new-url" class="new-item-input" placeholder="https://...">
                </div>
              </div>
              <div class="row">
                <div class="col-6 offset-3">
                  <label for="new-rating">Rating</label>
                  <fieldset class="star-ratings" id="new-rating">
                    <legend>Rating</legend>
                    <input type="radio" value="1" id="new-bookmark-1" name="rating" form="new-bookmark">
                    <label for="new-bookmark-1" class="star-rating">1</label>
                    <input type="radio" value="2" id="new-bookmark-2" name="rating" form="new-bookmark">
                    <label for="new-bookmark-2" class="star-rating">2</label>
                    <input type="radio" value="3" id="new-bookmark-3" name="rating" form="new-bookmark">
                    <label for="new-bookmark-3" class="star-rating">3</label>
                    <input type="radio" value="4" id="new-bookmark-4" name="rating" form="new-bookmark">
                    <label for="new-bookmark-4" class="star-rating">4</label>
                    <input type="radio" value="5" id="new-bookmark-5" name="rating" form="new-bookmark">
                    <label for="new-bookmark-5" class="star-rating">5</label>
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
                  <button class="js-new-bm-cancel">Cancel</button>
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
        return '5star';
      case 4:
        return '4star';
      case 3:
        return '3star';
      case 2:
        return '2star';
      case 1:
        return '1star';
      default:
        return 'no-star';
      }
    }
      

    const generateBookmarkStr = function(bookmark) {
      const description = (bookmark.desc) ? bookmark.desc : '';
      const hiddenIfNotExpanded = (!bookmark.expanded) ? 'hidden' : '';
      const expandedToggle = (!bookmark.expanded) ? '<span class="fas circle"></span>': '<span class="fas circle"></span>';

      return `
        <li class="js-bookmark-element bookmark-element"  data-item-id="${bookmark.id}">
          <a href="" class="js-bookmark-title-clickable bookmark-title-clickable">
            <div class="bookmark-title">
              <h3>${expandedToggle} ${bookmark.title}</h3>
            </div>
          </a>
          <div class="bookmark-details ${hiddenIfNotExpanded}">
            <p>${description}</p>
            <a class="js-site-link btn" href="${bookmark.url}" target="_blank">Visit Site</a>
          </div>
          <form class="js-bookmark-props bookmark-props" id="${bookmark.id}-form">
            <div class="row">
              <div class="col-6">
                <p class="rating-display">${generateRating(bookmark)}</p>
              </div>
              <div class="col-3 offset-3">
                <button class="far fa-trash-alt btn-delete"><span class="btn-label btn-label-delete">Delete</span></button>
              </div>
            </div>
          </form>
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

      store.toggleBookmarkExpanded(currentId);
      render();
    });
  };

  const handleAddClicked = function() {
    $('.main-section').on('click', '.js-create-bookmark', function(event) {
      event.preventDefault();

      store.toggleAdding();
      render();
    });
  };

  const handleCancel = function() {
    $('.main-section').on('click', '.js-new-bm-cancel', function(event) {
      event.preventDefault();

      store.toggleAdding();
      render();
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
