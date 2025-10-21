/* eslint-disable no-alert */
(function treasuryRegisterController(global) {
  const { TreasuryApi, TreasuryApiError } = global;

  if (!TreasuryApi) {
    // eslint-disable-next-line no-console
    console.warn('TreasuryApi is not available. Treasury register form will not be interactive.');
    return;
  }

  const state = {
    movementType: null,
    selectedContact: null,
    suggestedContacts: [],
    uploadedFiles: [],
    tempContacts: [],
    debounceTimer: null,
  };

  const selectors = {
    movementForm: document.getElementById('movement-form'),
    movementCards: document.querySelectorAll('[data-movement-card]'),
    movementTypeError: document.getElementById('movement-type-error'),
    mediumSelect: document.getElementById('medium'),
    mediumError: document.getElementById('medium-error'),
    currencySelect: document.getElementById('currency'),
    currencyError: document.getElementById('currency-error'),
    amountInput: document.getElementById('amount'),
    amountError: document.getElementById('amount-error'),
    currencySymbol: document.getElementById('currency-symbol'),
    referenceInput: document.getElementById('reference'),
    charCount: document.getElementById('char-count'),
    datetimeInput: document.getElementById('datetime'),
    contactInput: document.getElementById('contact'),
    contactDropdown: document.getElementById('contact-dropdown'),
    contactError: document.getElementById('contact-error'),
    fileInput: document.getElementById('file-input'),
    fileList: document.getElementById('file-list'),
    operationInput: document.getElementById('operation'),
    operationInfo: document.getElementById('operation-info'),
    operationDetails: document.getElementById('operation-details'),
    registerButton: document.getElementById('register-btn'),
    registerSpinner: document.getElementById('register-spinner'),
    registerText: document.getElementById('register-text'),
    toastContainer: document.getElementById('toast-container'),
  };

  const modalSelectors = {
    newContactModal: document.getElementById('new-contact-modal'),
    newContactName: document.getElementById('new-contact-name'),
    newContactType: document.getElementById('new-contact-type'),
    newContactCuit: document.getElementById('new-contact-cuit'),
  };

  const formatCurrency = (amount, currency) => {
    const numeric = Number(amount) || 0;
    const formatter = numeric.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currency === 'USD' ? 'USD ' : '$'}${formatter}`;
  };

  const parseAmount = (rawValue) => {
    if (!rawValue) return NaN;
    const normalized = rawValue
      .replace(/\s+/g, '')
      .replace(/[.]/g, '')
      .replace(',', '.');
    return Number(normalized);
  };

  const showToast = (message, type = 'info') => {
    if (!selectors.toastContainer) return;
    const palette = {
      success: 'bg-success text-white',
      warning: 'bg-warning text-gray-900',
      danger: 'bg-danger text-white',
      info: 'bg-primary text-white',
      error: 'bg-danger text-white',
    };
    const iconMap = {
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      danger: 'fa-times-circle',
      info: 'fa-info-circle',
      error: 'fa-times-circle',
    };
    const toast = document.createElement('div');
    toast.className = `fade-in px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 ${
      palette[type] || palette.info
    }`;
    toast.innerHTML = `<i class="fa-solid ${iconMap[type] || iconMap.info}"></i><span>${message}</span>`;
    selectors.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  const toggleRegisterButton = (loading) => {
    if (!selectors.registerButton) return;
    if (loading) {
      selectors.registerButton.setAttribute('disabled', 'disabled');
      selectors.registerSpinner?.classList.remove('hidden');
      selectors.registerText.textContent = 'Registrando...';
    } else {
      selectors.registerButton.removeAttribute('disabled');
      selectors.registerSpinner?.classList.add('hidden');
      selectors.registerText.textContent = 'Registrar movimiento';
    }
  };

  const clearFieldError = (field) => {
    const element = document.getElementById(`${field}-error`);
    if (element) {
      element.classList.add('hidden');
      element.textContent = '';
    }
  };

  const setFieldError = (field, message) => {
    const element = document.getElementById(`${field}-error`);
    if (element) {
      element.textContent = message;
      element.classList.remove('hidden');
    }
  };

  const hideContactDropdown = () => {
    if (selectors.contactDropdown) {
      selectors.contactDropdown.classList.add('hidden');
      selectors.contactDropdown.innerHTML = '';
    }
  };

  const showContactDropdown = (contacts) => {
    if (!selectors.contactDropdown || !contacts.length) {
      hideContactDropdown();
      return;
    }
    const html = contacts
      .map(
        (contact, index) => `
        <button type="button" class="w-full text-left px-3 py-2 hover:bg-blue-50 focus:outline-none focus:bg-blue-100" data-contact-index="${index}">
            <div class="text-sm font-medium text-text-primary">${contact.shortName || contact.fullName}</div>
            <div class="text-xs text-gray-500">${contact.contactType === 'provider' ? 'Proveedor' : 'Cliente'} • ${contact.cuit || 'Sin CUIT'}</div>
        </button>`
      )
      .join('');
    selectors.contactDropdown.innerHTML = html;
    selectors.contactDropdown.classList.remove('hidden');
  };

  const selectMovementType = (type) => {
    state.movementType = type;
    selectors.movementCards.forEach((card) => {
      const isActive = card.dataset.movementCard === type;
      card.classList.toggle('selected', isActive);
      card.setAttribute('aria-checked', String(isActive));
      card.classList.toggle('border-primary', isActive);
      card.classList.toggle('bg-blue-50', isActive);
    });
    clearFieldError('movement-type');
  };

  const updateCurrencySymbol = () => {
    if (!selectors.currencySelect || !selectors.currencySymbol) return;
    const value = selectors.currencySelect.value;
    selectors.currencySymbol.textContent = value === 'USD' ? 'USD' : value ? '$' : '';
  };

  const updateCharCount = () => {
    if (!selectors.referenceInput || !selectors.charCount) return;
    const length = selectors.referenceInput.value.length;
    selectors.charCount.textContent = `${length}/200`;
  };

  const formatAmountInput = () => {
    if (!selectors.amountInput) return;
    const value = selectors.amountInput.value;
    const numeric = parseAmount(value);
    if (!Number.isNaN(numeric)) {
      selectors.amountInput.value = numeric
        .toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .replace('.', ',');
    }
  };

  const renderFileList = () => {
    if (!selectors.fileList) return;
    if (!state.uploadedFiles.length) {
      selectors.fileList.innerHTML =
        '<p class="text-sm text-gray-500">No se adjuntaron archivos en esta etapa.</p>';
      return;
    }
    selectors.fileList.innerHTML = state.uploadedFiles
      .map(
        (file, index) => `
        <div class="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-lg">
            <div class="flex items-center space-x-2">
                <i class="fa-solid fa-paperclip text-gray-500"></i>
                <span class="text-sm text-text-primary">${file.name}</span>
                <span class="text-xs text-gray-500">${(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button class="text-danger hover:text-red-700 text-sm" data-remove-file="${index}">Eliminar</button>
        </div>`
      )
      .join('');
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    state.uploadedFiles = state.uploadedFiles.concat(files);
    renderFileList();
  };

  const searchContacts = async (query) => {
    try {
      const results = await TreasuryApi.searchClients({ query, limit: 10 });
      const normalized = results.map((contact) => ({
        id: contact._id || contact.id,
        shortName: contact.shortName || contact.fullName || contact.displayName,
        fullName: contact.fullName || contact.shortName,
        contactType: contact.contactType,
        cuit: contact.cuit,
      }));
      state.suggestedContacts = normalized.concat(state.tempContacts);
      showContactDropdown(state.suggestedContacts);
    } catch (error) {
      if (error instanceof TreasuryApiError && error.isUnauthorized()) {
        showToast('No tenés permisos para ver contactos.', 'danger');
      } else {
        showToast('No pudimos obtener la lista de contactos.', 'danger');
      }
    }
  };

  const selectContact = (indexOrId) => {
    const index =
      typeof indexOrId === 'number'
        ? indexOrId
        : state.suggestedContacts.findIndex((contact) => contact.id === indexOrId);
    const contact = state.suggestedContacts[index];
    if (!contact) return;
    state.selectedContact = contact;
    selectors.contactInput.value = contact.shortName || contact.fullName;
    hideContactDropdown();
    clearFieldError('contact');
    showToast(`Contacto seleccionado: ${contact.shortName || contact.fullName}`, 'success');
  };

  const handleOperationInput = () => {
    if (!selectors.operationInput || !selectors.operationInfo || !selectors.operationDetails) return;
    const value = selectors.operationInput.value.trim();
    if (value.length < 4) {
      selectors.operationInfo.classList.add('hidden');
      selectors.operationDetails.innerHTML = '';
      return;
    }
    const contactName = state.selectedContact
      ? state.selectedContact.shortName || state.selectedContact.fullName
      : 'Sin contacto asociado';
    selectors.operationDetails.innerHTML = `
        <div class="font-semibold text-text-primary">#${value}</div>
        <div class="mt-1 text-xs text-gray-600">El movimiento se vinculará al código ingresado al guardar.</div>
        <div class="mt-2 text-xs text-gray-500">Contacto actual: ${contactName}</div>`;
    selectors.operationInfo.classList.remove('hidden');
  };

  const validateForm = () => {
    let valid = true;
    if (!state.movementType) {
      setFieldError('movement-type', 'Seleccioná si es ingreso o egreso.');
      valid = false;
    } else {
      clearFieldError('movement-type');
    }

    if (!selectors.mediumSelect.value) {
      setFieldError('medium', 'Seleccioná un medio.');
      valid = false;
    } else {
      clearFieldError('medium');
    }

    if (!selectors.currencySelect.value) {
      setFieldError('currency', 'Seleccioná una moneda.');
      valid = false;
    } else {
      clearFieldError('currency');
    }

    const amount = parseAmount(selectors.amountInput.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFieldError('amount', 'Ingresá un monto válido.');
      valid = false;
    } else {
      clearFieldError('amount');
    }

    if (!state.selectedContact) {
      setFieldError('contact', 'Seleccioná un contacto.');
      valid = false;
    } else {
      clearFieldError('contact');
    }

    return valid;
  };

  const buildPayload = () => {
    const amount = parseAmount(selectors.amountInput.value);
    const movementAt = selectors.datetimeInput.value
      ? new Date(selectors.datetimeInput.value).toISOString()
      : new Date().toISOString();
    const payload = {
      type: state.movementType,
      medium: selectors.mediumSelect.value,
      currency: selectors.currencySelect.value,
      amount,
      movementAt,
      contactId: state.selectedContact?.id,
      reference: selectors.referenceInput.value.trim() || undefined,
    };

    const operationValue = selectors.operationInput.value.trim();
    if (operationValue.length >= 4) {
      payload.operationReference = operationValue;
    }

    return payload;
  };

  const clearForm = () => {
    selectors.movementForm.reset();
    selectors.currencySymbol.textContent = '';
    selectors.charCount.textContent = '0/200';
    selectors.movementCards.forEach((card) => {
      card.classList.remove('selected', 'border-primary', 'bg-blue-50');
      card.setAttribute('aria-checked', 'false');
    });
    state.movementType = null;
    state.selectedContact = null;
    selectors.contactInput.value = '';
    selectors.operationInfo.classList.add('hidden');
    selectors.operationDetails.innerHTML = '';
    state.uploadedFiles = [];
    renderFileList();
    ['movement-type', 'medium', 'currency', 'amount', 'contact'].forEach(clearFieldError);
  };

  const registerMovement = async () => {
    if (!validateForm()) {
      showToast('Revisá los campos obligatorios antes de continuar.', 'warning');
      return;
    }

    toggleRegisterButton(true);
    try {
      const payload = buildPayload();
      const response = await TreasuryApi.registerMovement(payload);
      const movementId = response?.movement?.movementCode || response?.movement?.id;
      showToast('Movimiento registrado correctamente.', 'success');
      clearForm();
      if (movementId) {
        setTimeout(() => {
          window.location.href = `tesoreria-movimiento-detalle.html?movement=${encodeURIComponent(
            movementId
          )}`;
        }, 900);
      }
    } catch (error) {
      if (error instanceof TreasuryApiError) {
        showToast(error.message || 'No pudimos registrar el movimiento.', 'danger');
      } else {
        showToast('Ocurrió un error inesperado al registrar el movimiento.', 'danger');
        // eslint-disable-next-line no-console
        console.error(error);
      }
    } finally {
      toggleRegisterButton(false);
    }
  };

  const saveDraft = () => {
    showToast('Movimiento guardado como borrador (local).', 'info');
  };

  const openNewContactModal = () => {
    modalSelectors.newContactModal?.classList.remove('hidden');
    modalSelectors.newContactName?.focus();
  };

  const closeNewContactModal = () => {
    modalSelectors.newContactModal?.classList.add('hidden');
    modalSelectors.newContactName.value = '';
    modalSelectors.newContactType.value = 'Cliente';
    modalSelectors.newContactCuit.value = '';
  };

  const saveNewContact = () => {
    const name = modalSelectors.newContactName.value.trim();
    if (!name) {
      showToast('Completá el nombre del contacto.', 'warning');
      modalSelectors.newContactName.focus();
      return;
    }
    const newContact = {
      id: `tmp-${Date.now()}`,
      shortName: name,
      fullName: name,
      contactType: modalSelectors.newContactType.value === 'Proveedor' ? 'provider' : 'client',
      cuit: modalSelectors.newContactCuit.value.trim(),
    };
    state.tempContacts.push(newContact);
    state.suggestedContacts.unshift(newContact);
    selectContact(newContact.id);
    closeNewContactModal();
    showToast('Contacto creado y seleccionado correctamente.', 'success');
  };

  const goToTreasury = () => {
    window.location.href = 'tesoreria-movimientos.html';
  };

  const closeModal = () => {
    window.location.href = 'tesoreria-movimientos.html';
  };

  const applyOperationDefaults = (operationId) => {
    selectors.operationInput.value = operationId;
    handleOperationInput();
    showToast(`Operación ${operationId} aplicada como referencia.`, 'info');
  };

  const bindEvents = () => {
    selectors.movementCards.forEach((card) => {
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectMovementType(card.dataset.movementCard);
        }
      });
    });

    selectors.currencySelect?.addEventListener('change', updateCurrencySymbol);
    selectors.amountInput?.addEventListener('blur', formatAmountInput);
    selectors.referenceInput?.addEventListener('input', updateCharCount);

    selectors.contactInput?.addEventListener('input', (event) => {
      const value = event.target.value.trim();
      clearFieldError('contact');
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
      }
      if (value.length < 2) {
        hideContactDropdown();
        return;
      }
      state.debounceTimer = setTimeout(() => {
        searchContacts(value);
      }, 250);
    });

    selectors.contactInput?.addEventListener('focus', () => {
      if (state.suggestedContacts.length) {
        showContactDropdown(state.suggestedContacts);
      }
    });

    document.addEventListener('click', (event) => {
      if (
        selectors.contactDropdown &&
        !selectors.contactDropdown.contains(event.target) &&
        event.target !== selectors.contactInput
      ) {
        hideContactDropdown();
      }
    });

    selectors.contactDropdown?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-contact-index]');
      if (!button) return;
      const index = Number(button.getAttribute('data-contact-index'));
      selectContact(index);
    });

    selectors.fileInput?.addEventListener('change', (event) => {
      addFiles(event.target.files);
      selectors.fileInput.value = '';
    });

    selectors.fileList?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-file]');
      if (!button) return;
      const index = Number(button.getAttribute('data-remove-file'));
      state.uploadedFiles.splice(index, 1);
      renderFileList();
    });

    selectors.operationInput?.addEventListener('input', handleOperationInput);

    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
      ['dragenter', 'dragover'].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
          event.preventDefault();
          dropZone.classList.add('dragover');
        });
      });
      ['dragleave', 'dragend', 'drop'].forEach((eventName) => {
        dropZone.addEventListener(eventName, (event) => {
          event.preventDefault();
          dropZone.classList.remove('dragover');
        });
      });
      dropZone.addEventListener('drop', (event) => {
        addFiles(event.dataTransfer?.files);
      });
    }

    selectors.movementForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      registerMovement();
    });
  };

  const initialize = () => {
    const now = new Date();
    if (selectors.datetimeInput) {
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      selectors.datetimeInput.value = localISO;
    }
    renderFileList();
    updateCharCount();
    bindEvents();
  };

  // Expose functions referenced by inline attributes
  global.selectMovementType = selectMovementType;
  global.openNewContactModal = openNewContactModal;
  global.closeNewContactModal = closeNewContactModal;
  global.saveNewContact = saveNewContact;
  global.selectContact = (id) => selectContact(id);
  global.applyOperationDefaults = applyOperationDefaults;
  global.saveDraft = saveDraft;
  global.goToTreasury = goToTreasury;
  global.closeModal = closeModal;

  document.addEventListener('DOMContentLoaded', initialize);
})(typeof window !== 'undefined' ? window : globalThis);
