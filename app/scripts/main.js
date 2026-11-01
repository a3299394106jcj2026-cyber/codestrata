import { initializeSearch } from "./ui/search.js"

const elements = {
  body: document.body,
  form: document.getElementById("repo-form"),
  input: document.getElementById("repo-input"),
  submit: document.getElementById("repo-submit"),
  statusEl: document.getElementById("repo-status"),
  quotaEl: document.getElementById("quota-status"),
  landingView: document.getElementById("landing-view"),
  workspaceView: document.getElementById("workspace-view"),
  sourceEl: document.getElementById("repo-source"),
  sourceNoteEl: document.getElementById("source-note"),
  repositoryEl: document.getElementById("repo-profile"),
  filesEl: document.getElementById("repo-files"),
  strataEl: document.getElementById("repo-strata"),
  commitsEl: document.getElementById("repo-commits"),
  releasesEl: document.getElementById("repo-releases"),
  contributorsEl: document.getElementById("repo-contributors"),
  riskEl: document.getElementById("repo-risk"),
  recommendationEl: document.getElementById("repo-recommendation"),
  refreshButton: document.getElementById("refresh-button"),
  reportButton: document.getElementById("report-button"),
  reportDialog: document.getElementById("report-dialog"),
  reportContent: document.getElementById("report-content"),
  reportCopy: document.getElementById("report-copy"),
  reportClose: document.getElementById("report-close"),
  copyFeedback: document.getElementById("copy-feedback"),
  methodButton: document.getElementById("method-button"),
  methodDialog: document.getElementById("method-dialog"),
  methodClose: document.getElementById("method-close"),
  homeButton: document.getElementById("home-button"),
  demoButtons: [...document.querySelectorAll("[data-demo]")]
}

initializeSearch(elements)
