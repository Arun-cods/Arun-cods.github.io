/**
 * CartShare - Collaborative Shopping Cart & Audit-Ready Receipt
 * Author: Gopagani Arun
 * 
 * Features:
 * - Shared item addition & removal with member attribution
 * - Free Shipping Delivery Threshold ($75) live progress tracking
 * - Individual member expense splitting (audit-ready transparency)
 * - Printable receipt generation with @media print support
 * - Cross-tab instant synchronization
 */

const CartManager = (() => {
  const CART_PREFIX = 'cartshare_cart_';
  const FREE_SHIPPING_THRESHOLD = 75.00;
  const STANDARD_DELIVERY_FEE = 5.99;

  let currentRoom = null;

  function getCartKey(roomCode) {
    return roomCode ? `${CART_PREFIX}${roomCode}` : null;
  }

  function getCartItems() {
    if (!currentRoom) return [];
    return StorageSync.getItem(getCartKey(currentRoom), []);
  }

  function saveCartItems(items) {
    if (!currentRoom) return;
    StorageSync.setItem(getCartKey(currentRoom), items);
  }

  /**
   * Calculate all cart totals, thresholds, and member splits
   */
  function calculateSummary(items) {
    let subtotal = 0;
    const memberTotals = {};

    items.forEach(item => {
      const lineTotal = Number(item.qty) * Number(item.price);
      subtotal += lineTotal;

      const member = item.addedBy || 'Anonymous';
      if (!memberTotals[member]) {
        memberTotals[member] = {
          itemTotal: 0,
          itemCount: 0
        };
      }
      memberTotals[member].itemTotal += lineTotal;
      memberTotals[member].itemCount += Number(item.qty);
    });

    const isThresholdMet = subtotal >= FREE_SHIPPING_THRESHOLD;
    const deliveryFee = (items.length === 0) ? 0.00 : (isThresholdMet ? 0.00 : STANDARD_DELIVERY_FEE);
    const grandTotal = subtotal + deliveryFee;
    const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    return {
      subtotal,
      deliveryFee,
      grandTotal,
      isThresholdMet,
      amountNeeded,
      progressPercent,
      memberTotals
    };
  }

  /**
   * Render the cart UI, threshold bar, and expense split
   */
  function render() {
    const items = getCartItems();
    const summary = calculateSummary(items);

    // 1. Update Cart Item Count Badge
    const countBadge = document.getElementById('cart-item-count');
    if (countBadge) {
      countBadge.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;
    }

    // 2. Render Cart Table Body
    const tbody = document.getElementById('cart-items-body');
    const emptyMsg = document.getElementById('empty-cart-message');

    if (items.length === 0) {
      if (tbody) tbody.innerHTML = '';
      if (emptyMsg) emptyMsg.style.display = 'block';
    } else {
      if (emptyMsg) emptyMsg.style.display = 'none';
      if (tbody) {
        tbody.innerHTML = items.map(item => {
          const lineTotal = (Number(item.qty) * Number(item.price)).toFixed(2);
          const initial = (item.addedBy || 'A').charAt(0).toUpperCase();

          return `
            <tr>
              <td>
                <span class="fw-semibold text-dark">${escapeHtml(item.name)}</span>
              </td>
              <td>
                <div class="user-chip">
                  <span class="user-avatar-dot">${initial}</span>
                  <span>${escapeHtml(item.addedBy || 'Anonymous')}</span>
                </div>
              </td>
              <td class="text-center fw-semibold">${item.qty}</td>
              <td class="text-end">$${Number(item.price).toFixed(2)}</td>
              <td class="text-end fw-bold">$${lineTotal}</td>
              <td class="text-center no-print">
                <button class="item-delete-btn" data-id="${item.id}" title="Remove Item">
                  <i class="bi bi-trash3-fill"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        // Attach delete listeners
        tbody.querySelectorAll('.item-delete-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            removeItem(btn.getAttribute('data-id'));
          });
        });
      }
    }

    // 3. Update Totals Footer
    const subtotalEl = document.getElementById('cart-subtotal');
    const deliveryFeeEl = document.getElementById('cart-delivery-fee');
    const deliveryNoteEl = document.getElementById('delivery-fee-note');
    const grandTotalEl = document.getElementById('cart-grand-total');

    if (subtotalEl) subtotalEl.textContent = `$${summary.subtotal.toFixed(2)}`;
    if (deliveryFeeEl) {
      deliveryFeeEl.textContent = `$${summary.deliveryFee.toFixed(2)}`;
      if (summary.isThresholdMet && summary.subtotal > 0) {
        deliveryFeeEl.className = 'text-end fw-bold text-success';
        deliveryFeeEl.textContent = 'FREE ($0.00)';
      } else {
        deliveryFeeEl.className = 'text-end fw-bold';
      }
    }
    if (deliveryNoteEl) {
      deliveryNoteEl.textContent = summary.isThresholdMet
        ? '(Free Shipping Unlocked!)'
        : '($5.99 if below $75.00)';
    }
    if (grandTotalEl) grandTotalEl.textContent = `$${summary.grandTotal.toFixed(2)}`;

    // 4. Update Delivery Threshold Progress Bar
    renderThreshold(summary);

    // 5. Update Expense Split Breakdown
    renderExpenseSplit(summary);
  }

  function renderThreshold(summary) {
    const bar = document.getElementById('threshold-bar');
    const badge = document.getElementById('threshold-status-badge');
    const text = document.getElementById('threshold-progress-text');
    const hint = document.getElementById('threshold-hint-text');
    const box = document.getElementById('threshold-box');

    if (bar) bar.style.width = `${summary.progressPercent}%`;
    if (text) text.textContent = `$${summary.subtotal.toFixed(2)} / $${FREE_SHIPPING_THRESHOLD.toFixed(2)}`;

    if (summary.isThresholdMet) {
      if (badge) {
        badge.className = 'badge bg-success ms-2';
        badge.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> FREE SHIPPING UNLOCKED!';
      }
      if (hint) {
        hint.innerHTML = '<strong class="text-success">🎉 Congratulations!</strong> Your group reached the $75.00 threshold. Free shipping is applied.';
      }
      if (box) box.classList.add('threshold-unlocked');
    } else {
      if (badge) {
        badge.className = 'badge bg-primary ms-2';
        badge.textContent = `$${summary.amountNeeded.toFixed(2)} away`;
      }
      if (hint) {
        hint.innerHTML = `Add <strong>$${summary.amountNeeded.toFixed(2)}</strong> more to unlock FREE group shipping and save $5.99!`;
      }
      if (box) box.classList.remove('threshold-unlocked');
    }
  }

  function renderExpenseSplit(summary) {
    const container = document.getElementById('expense-split-list');
    if (!container) return;

    const members = Object.keys(summary.memberTotals);
    if (members.length === 0) {
      container.innerHTML = `<p class="text-muted small mb-0">No items added yet to calculate individual totals.</p>`;
      return;
    }

    // Distribute delivery fee equally among active participants (if any)
    const splitDelivery = members.length > 0 ? (summary.deliveryFee / members.length) : 0;

    container.innerHTML = members.map(member => {
      const data = summary.memberTotals[member];
      const memberFinal = data.itemTotal + splitDelivery;
      const initial = member.charAt(0).toUpperCase();

      return `
        <div class="expense-item">
          <div class="d-flex align-items-center gap-2">
            <span class="user-avatar-dot">${initial}</span>
            <div>
              <div class="fw-semibold small">${escapeHtml(member)}</div>
              <div class="text-muted" style="font-size: 0.75rem;">
                ${data.itemCount} ${data.itemCount === 1 ? 'item' : 'items'}
                ${splitDelivery > 0 ? `+ $${splitDelivery.toFixed(2)} delivery` : ''}
              </div>
            </div>
          </div>
          <div class="text-end">
            <span class="fw-bold text-dark">$${memberFinal.toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Add Item action
   */
  function addItem(name, qty, price) {
    if (!currentRoom) return;

    const user = localStorage.getItem('cartshare_user') || 'Anonymous';
    const items = getCartItems();
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      qty: parseInt(qty, 10),
      price: parseFloat(price),
      addedBy: user,
      timestamp: Date.now()
    };

    items.push(newItem);
    saveCartItems(items);
    render();

    // Broadcast cart change
    StorageSync.publish('cart_updated', { roomCode: currentRoom, items });

    // Activity Log
    ActivityLog.add(
      currentRoom,
      'add',
      `added ${newItem.qty} × "${newItem.name}" ($${(newItem.qty * newItem.price).toFixed(2)})`
    );
  }

  /**
   * Remove Item action
   */
  function removeItem(id) {
    if (!currentRoom) return;

    let items = getCartItems();
    const removedItem = items.find(i => i.id === id);
    if (!removedItem) return;

    items = items.filter(i => i.id !== id);
    saveCartItems(items);
    render();

    // Broadcast cart change
    StorageSync.publish('cart_updated', { roomCode: currentRoom, items });

    // Activity Log
    ActivityLog.add(
      currentRoom,
      'remove',
      `removed "${removedItem.name}" from the cart`
    );
  }

  /**
   * Populate & Show Audit-Ready Printable Receipt Modal
   */
  function showReceiptModal() {
    if (!currentRoom) return;

    const items = getCartItems();
    const summary = calculateSummary(items);

    document.getElementById('receipt-room-code').textContent = currentRoom;
    document.getElementById('receipt-date').textContent = new Date().toLocaleString();

    const tbody = document.getElementById('receipt-items-body');
    if (tbody) {
      if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #888;">No items in this cart.</td></tr>`;
      } else {
        tbody.innerHTML = items.map(item => `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.addedBy)}</td>
            <td style="text-align: center;">${item.qty}</td>
            <td style="text-align: right;">$${Number(item.price).toFixed(2)}</td>
            <td style="text-align: right;">$${(item.qty * item.price).toFixed(2)}</td>
          </tr>
        `).join('');
      }
    }

    document.getElementById('receipt-subtotal').textContent = `$${summary.subtotal.toFixed(2)}`;
    document.getElementById('receipt-delivery').textContent = summary.isThresholdMet
      ? '$0.00 (Free Shipping - Met $75)'
      : `$${summary.deliveryFee.toFixed(2)}`;
    document.getElementById('receipt-grand-total').textContent = `$${summary.grandTotal.toFixed(2)}`;

    // Expense breakdown in receipt
    const breakdownEl = document.getElementById('receipt-expense-breakdown');
    if (breakdownEl) {
      const members = Object.keys(summary.memberTotals);
      if (members.length === 0) {
        breakdownEl.innerHTML = '<span class="text-muted">No items to calculate.</span>';
      } else {
        const splitDelivery = summary.deliveryFee / members.length;
        breakdownEl.innerHTML = members.map(m => {
          const data = summary.memberTotals[m];
          const total = data.itemTotal + splitDelivery;
          return `
            <div style="display: flex; justify-content: space-between; padding: 2px 0;">
              <span>• ${escapeHtml(m)} (${data.itemCount} items${splitDelivery > 0 ? ` + $${splitDelivery.toFixed(2)} del.` : ''}):</span>
              <span style="font-weight: bold;">$${total.toFixed(2)}</span>
            </div>
          `;
        }).join('');
      }
    }

    const modal = new bootstrap.Modal(document.getElementById('receiptModal'));
    modal.show();
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Subscribe to real-time cart updates from other tabs
  StorageSync.subscribe('cart_updated', (payload) => {
    if (payload && payload.roomCode === currentRoom) {
      saveCartItems(payload.items);
      render();
    }
  });

  // Initialize event listeners
  function initListeners() {
    const addForm = document.getElementById('add-item-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('item-name');
        const qtyInput = document.getElementById('item-qty');
        const priceInput = document.getElementById('item-price');

        if (nameInput.value && qtyInput.value && priceInput.value) {
          addItem(nameInput.value, qtyInput.value, priceInput.value);
          addForm.reset();
          qtyInput.value = 1;
          nameInput.focus();
        }
      });
    }

    const btnOpenReceipt = document.getElementById('btn-open-receipt');
    if (btnOpenReceipt) {
      btnOpenReceipt.addEventListener('click', showReceiptModal);
    }

    const btnTriggerPrint = document.getElementById('btn-trigger-print');
    if (btnTriggerPrint) {
      btnTriggerPrint.addEventListener('click', () => {
        window.print();
      });
    }
  }

  return {
    init: (roomCode) => {
      currentRoom = roomCode;
      initListeners();
      render();
    },
    refresh: () => {
      render();
    }
  };
})();
