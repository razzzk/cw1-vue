<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchLessons, postOrder, putLesson } from './api';

// I use this to switch between the main lessons page and the cart page
const view = ref('lessons');

// I store all lessons and the user's cart in these two refs
const lessons = ref([]);
const cart = ref([]);

// These two are used for sorting the lessons in the dropdowns
const sortKey = ref('topic');
const sortDir = ref('asc');

// These store the user's checkout details
const name = ref('');
const phone = ref('');

// Simple validation for name and phone so the form is not empty or wrong
// Name: the user is only allowed to  insetonly letters/spaces
// Phone the user is only allowed to insert digits 
const validName = computed(() => /^[A-Za-z\s'-]+$/.test(name.value));
const validPhone = computed(() => /^\d+$/.test(phone.value));

// Button should only be active when both fields are valid and cart not empty
const checkoutEnabled = computed(() => {
  return validName.value && validPhone.value && cart.value.length > 0;
});

// I make a sorted version of the lessons depending on what the user picked
const sortedLessons = computed(() => {
  const copy = [...lessons.value];

  copy.sort((a, b) => {
    const key = sortKey.value;
    const aVal = a[key];
    const bVal = b[key];

    // Numbers and text need different comparisons
    let cmp;
    if (typeof aVal === 'number') {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal).localeCompare(String(bVal));
    }

    return sortDir.value === 'asc' ? cmp : -cmp;
  });

  return copy;
});

// When the user adds a lesson, I push it into the cart and lower its space count
function addToCart(item) {
  if (item.space > 0) {
    cart.value.push({
      _id: item._id,
      topic: item.topic,
      price: item.price
    });

    item.space -= 1;
  }
}

// When removing a lesson from the cart, I increase its space again
function removeFromCart(index) {
  const removed = cart.value.splice(index, 1)[0];
  const lesson = lessons.value.find(l => l._id === removed._id);

  if (lesson) {
    lesson.space += 1;
  }
}

// When the user submits the order:
// 1 Save the order in the backend
// 2 Update each lesson's spaces in the database
// 3 Clear the cart and go back to lessons
async function checkout() {
  if (!checkoutEnabled.value) return;

  const lessonIDs = cart.value.map(i => i._id);

  await postOrder({
    name: name.value,
    phone: phone.value,
    lessonIDs: lessonIDs,
    spaces: cart.value.length
  });

  for (const l of lessons.value) {
    await putLesson(l._id, { space: l.space });
  }

  cart.value = [];
  alert('Order submitted successfully');
  view.value = 'lessons';
}

// Used whenever I want to re-fetch the lessons again from the backend
async function reloadLessons() {
  lessons.value = await fetchLessons();
}

// When the page loads, I fetch the lessons once
onMounted(async () => {
  lessons.value = await fetchLessons();
});
</script>

<template>
  <div class="page">

    <!-- Top header with title, sorting and cart button -->
    <header class="header">
      <div class="header-main">
        <h1 class="title">After-School Classes</h1>
        <p class="subtitle">Browse activities and book a place for a student.</p>
      </div>

      <div class="header-actions">
        <div class="sort-controls">
          <label>
            Sort by
            <select v-model="sortKey">
              <option value="topic">Subject</option>
              <option value="location">Location</option>
              <option value="price">Price</option>
              <option value="space">Spaces</option>
            </select>
          </label>

          <label>
            Order
            <select v-model="sortDir">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>

        <div class="header-buttons">
          <button class="secondary-btn" @click="reloadLessons">
            Refresh
          </button>

          <button
            class="cart-btn"
            :disabled="view === 'lessons' && cart.length === 0"
            @click="view = view === 'lessons' ? 'cart' : 'lessons'"
          >
            <span v-if="view === 'lessons'">Cart</span>
            <span v-else>Back</span>
            <span class="cart-count">{{ cart.length }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="content">

      <!-- LESSONS PAGE -->
      <section v-if="view === 'lessons'" class="lessons-section">

        <div class="info-bar">
          <span>{{ sortedLessons.length }} lessons available</span>
          <span v-if="cart.length > 0">
            In cart: <strong>{{ cart.length }}</strong>
          </span>
        </div>

        <!-- Lessons grid -->
        <div class="lesson-grid">
          <article
            v-for="it in sortedLessons"
            :key="it._id"
            class="lesson-card lesson-card--horizontal"
          >
            <div class="lesson-left">
              <div class="lesson-chip">{{ it.topic }}</div>

              <div class="lesson-row">
                <span class="icon">📍</span>
                <span>{{ it.location }}</span>
              </div>

              <div class="lesson-row">
                <span class="icon">🎟️</span>
                <span>
                  <strong>{{ it.space }}</strong> spaces left
                </span>
              </div>
            </div>

            <div class="lesson-right">
              <div class="price-line">£{{ it.price }}</div>

              <button
                class="primary-btn"
                :disabled="it.space === 0"
                @click="addToCart(it)"
              >
                <span v-if="it.space > 0">Add to cart</span>
                <span v-else>Sold out</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      <!-- CART PAGE -->
      <section v-else class="cart-section">
        <div class="cart-columns">

          <!-- Left side: items in cart -->
          <div class="cart-box">
            <h2>Cart</h2>
            <p class="cart-subtitle">Remove lessons if you change your mind.</p>

            <div v-if="cart.length === 0" class="empty">
              <p>Your cart is empty.</p>
            </div>

            <ul v-else class="cart-list">
              <li v-for="(c, i) in cart" :key="i" class="cart-row">
                <div>
                  <div class="cart-title">{{ c.topic }}</div>
                  <div class="cart-price">£{{ c.price }}</div>
                </div>
                <button
                  class="secondary-btn secondary-btn--small"
                  @click="removeFromCart(i)"
                >
                  Remove
                </button>
              </li>
            </ul>
          </div>

          <!-- Right side: checkout -->
          <div class="cart-box">
            <h2>Checkout</h2>
            <p class="cart-subtitle">Enter your details to submit the order.</p>

            <div class="field">
              <label for="name">Name</label>
              <input
                id="name"
                v-model="name"
                type="text"
                placeholder="Student or parent name"
                :class="{ 'input-error': name && !validName }"
              />
              <small v-if="name && !validName" class="error">
                Name must contain letters and spaces only.
              </small>
            </div>

            <div class="field">
              <label for="phone">Phone</label>
              <input
                id="phone"
                v-model="phone"
                type="text"
                placeholder="07..."
                :class="{ 'input-error': phone && !validPhone }"
              />
              <small v-if="phone && !validPhone" class="error">
                Phone must contain numbers only.
              </small>
            </div>

            <button
              class="primary-btn primary-btn--full"
              :disabled="!checkoutEnabled"
              @click="checkout"
            >
              Submit order
            </button>

            <div class="validation-info">
              <span :class="['badge', validName ? 'badge--ok' : 'badge--bad']">
                Name valid: {{ validName }}
              </span>
              <span :class="['badge', validPhone ? 'badge--ok' : 'badge--bad']">
                Phone valid: {{ validPhone }}
              </span>
            </div>
          </div>

        </div>
      </section>
    </main>
  </div>
</template>
