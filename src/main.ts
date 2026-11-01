import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { registerServiceWorker } from './sw-register'

// Регистрация Service Worker для PWA
registerServiceWorker();

createApp(App).mount('#app')
