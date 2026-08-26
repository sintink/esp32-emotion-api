# 🤖 ESP32 Gemini Emotion API Gateway

![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![ESP32](https://img.shields.io/badge/ESP32-Hardware-E7352C?style=for-the-badge&logo=espressif&logoColor=white)
![License MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A lightweight Serverless API built on Vercel to generate dynamic emotion-based messages via Google Gemini AI. Specially formatted for **ESP32 Microcontrollers** displaying output on **P10 LED Matrix Boards**.

---

## 🏗️ System Architecture

```text
┌─────────────────┐       HTTP GET       ┌──────────────────────┐
│  ESP32 Board B  │ ───────────────────► │  Vercel Serverless   │
│ (WiFi Initiator)│ ◄─────────────────── │   (/api/emotion)     │
└────────┬────────┘      JSON Response   └──────────┬───────────┘
         │                                          │
    UART │ [WX_DATA] Payload                        │ Google AI SDK
         ▼                                          ▼
┌─────────────────┐                      ┌──────────────────────┐
│  ESP32 Board A  │                      │   Google Gemini AI   │
│  (P10 Display)  │                      │   (1.5 / 2.5 Flash)  │
└─────────────────┘                      └──────────────────────┘
