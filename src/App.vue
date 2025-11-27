<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchLessons, postOrder, putLesson } from './api';

// view state
const view = ref('lessons'); // 'lessons' | 'cart'

// data
const lessons = ref([]);
const cart = ref([]);

// sorting
const sortKey = ref('topic'); // 'topic' | 'location' | 'price' | 'space'
const sortDir = ref('asc');   // 'asc' | 'desc'

// checkout inputs
const name = ref('');
const phone = ref('');

// validation
const validName = computed(() => /^[A-Za-z\s'-]+$/.test(name.value));
const validPhone = computed(() => /^\d+$/.test(phone.value));
const checkoutEnabled = computed(
  () => validName.value && validPhone.value && cart.value.length > 0
);

// sorted lessons
const sortedLessons = computed(() => {
  const arr = [...lessons.value];
  arr.sort((a, b) => {
    const k = sortKey.value;
    const av = a[k];
    const bv = b[k];
    const cmp =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
    return sortDir.value === 'asc' ? cmp : -cmp;
  });
  return arr;
});

// actions
function addToCart(item) {
  if (item.space > 0) {
    cart.value.push({
      _id: item._id,
      topic: item.topic,
      price: item.price,
    });
    item.space -= 1;
  }
}

function removeFromCart(index) {
  const removed = cart.value.splice(index, 1)[0];
  const lesson = lessons.value.find((l) => l._id === removed._id);
  if (lesson) {
    lesson.space += 1;
  }
}

async function checkout() {
  if (!checkoutEnabled.value) return;

  const lessonIDs = cart.value.map((i) => i._id);
  await postOrder({
    name: name.value,
    phone: phone.value,
    lessonIDs,
    spaces: cart.value.length,
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
    </div>
   </template> 
