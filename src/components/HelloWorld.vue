<script setup lang="ts">
import { ref } from 'vue'
import { initializeApp } from 'firebase/app';
import {
  connectFunctionsEmulator,
  getFunctions, 
  httpsCallable,
} from 'firebase/functions';

defineProps<{ msg: string }>()
const count = ref(0)
const hello = ref('')
const fetchHello = async () => {
  hello.value = await (await fetch('/fn/helloWorld')).text();
}

const isDev = (location.href).startsWith('http://localhost');
const firebaseConfig = {
  projectId: 'altalk-test4',
};
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');
if (isDev) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
const helloOnCall = httpsCallable(functions, 'helloOnCall');
const hello2 = ref('')
const hello2msg = ref('okay, hello2')
const callHelloOnCall = async () => {
  const arg = {msg: hello2msg.value};
  const result = await helloOnCall(arg);
  hello2.value = JSON.stringify(result.data);
}
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="fetchHello">call hello</button>
    <button type="button" @click="hello=''">clear</button>
    <p>hello result: {{ hello }}</p>
    <button type="button" @click="callHelloOnCall">call helloOnCall</button>
    <button type="button" @click="hello2=''">clear</button>
    <input type="text" v-model="hello2msg">
    <p>helloOnCall result: {{ hello2 }}</p>

    <hr>
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
