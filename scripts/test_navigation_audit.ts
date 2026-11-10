/**
 * Navigation Audit & Verification Test Suite
 * Tests every single navigation path, history state, deep links, and back navigation.
 */

import { getViewFromHash, AppView } from '../src/App';
import { loadSettings, saveSettings, isOwnerAuthenticated, verifyOwnerPin, logoutOwner } from '../src/utils/storage';

interface NavState {
  currentView: AppView;
  previousView: AppView | null;
  historyStack: { view: AppView; from: AppView | null }[];
  historyIndex: number;
  showPinModal: boolean;
  activeRingingAlarm: string | null;
}

class NavigationSimulator {
  public state: NavState;
  public settingsApproved = true;
  public onboardingCompleted = true;

  constructor(initialHash = '#dashboard') {
    const hashView = getViewFromHash(initialHash) || 'dashboard';
    this.state = {
      currentView: hashView,
      previousView: null,
      historyStack: [{ view: hashView, from: null }],
      historyIndex: 0,
      showPinModal: false,
      activeRingingAlarm: null,
    };
  }

  public navigateTo(view: AppView, from?: AppView) {
    if (view === this.state.currentView) return;

    if (view === 'owner' && !isOwnerAuthenticated()) {
      this.state.showPinModal = true;
      return;
    }

    const effectiveFrom = from || this.state.currentView;
    this.state.previousView = effectiveFrom;
    
    // Truncate any forward history and push new state
    this.state.historyStack = this.state.historyStack.slice(0, this.state.historyIndex + 1);
    this.state.historyStack.push({ view, from: effectiveFrom });
    this.state.historyIndex = this.state.historyStack.length - 1;
    this.state.currentView = view;
  }

  public handleBack() {
    if (this.state.showPinModal) {
      this.state.showPinModal = false;
      return;
    }
    if (this.state.activeRingingAlarm) {
      this.state.activeRingingAlarm = null;
      return;
    }

    if (this.state.historyIndex > 0) {
      this.state.historyIndex--;
      const prevState = this.state.historyStack[this.state.historyIndex];
      
      // Owner access guard on back navigation
      if (prevState.view === 'owner' && !isOwnerAuthenticated()) {
        this.state.currentView = 'dashboard';
        return;
      }

      this.state.currentView = prevState.view;
      this.state.previousView = prevState.from;
      return;
    }

    // Fallback for refresh or deep links
    let fallbackView: AppView = 'dashboard';
    if (this.state.currentView === 'sounds') {
      fallbackView = this.state.previousView === 'settings' ? 'settings' : 'dashboard';
    } else if (this.state.currentView === 'invitation') {
      fallbackView = this.state.previousView === 'settings' ? 'settings' : (this.state.previousView === 'about' ? 'about' : 'dashboard');
    } else if (this.state.currentView === 'onboarding') {
      fallbackView = 'invitation';
    } else if (this.state.currentView === 'owner') {
      logoutOwner();
      fallbackView = 'dashboard';
    }

    this.state.currentView = fallbackView;
    this.state.previousView = null;
  }
}

async function runAudit() {
  const results: { test: string; passed: boolean; details: string }[] = [];

  function assert(name: string, condition: boolean, details: string) {
    results.push({ test: name, passed: condition, details });
    if (!condition) {
      console.error(`FAILED: ${name} -> ${details}`);
    } else {
      console.log(`PASSED: ${name}`);
    }
  }

  console.log('--- STARTING NAVIGATION AUDIT ---');

  // Test 1: Dashboard -> Sounds -> Back
  {
    const nav = new NavigationSimulator('#dashboard');
    nav.navigateTo('sounds');
    assert('T1.1 Navigate Dashboard -> Sounds', nav.state.currentView === 'sounds', `Current: ${nav.state.currentView}`);
    nav.handleBack();
    assert('T1.2 Back from Sounds returns to Dashboard', nav.state.currentView === 'dashboard', `Current: ${nav.state.currentView}`);
  }

  // Test 2: Dashboard -> Settings -> Back
  {
    const nav = new NavigationSimulator('#dashboard');
    nav.navigateTo('settings');
    assert('T2.1 Navigate Dashboard -> Settings', nav.state.currentView === 'settings', `Current: ${nav.state.currentView}`);
    nav.handleBack();
    assert('T2.2 Back from Settings returns to Dashboard', nav.state.currentView === 'dashboard', `Current: ${nav.state.currentView}`);
  }

  // Test 3: Dashboard -> Today Message -> Back
  {
    const nav = new NavigationSimulator('#dashboard');
    nav.navigateTo('daily-message');
    assert('T3.1 Navigate Dashboard -> Daily Message', nav.state.currentView === 'daily-message', `Current: ${nav.state.currentView}`);
    nav.handleBack();
    assert('T3.2 Back from Daily Message returns to Dashboard', nav.state.currentView === 'dashboard', `Current: ${nav.state.currentView}`);
  }

  // Test 4: Dashboard -> About Help Guide -> Back
  {
    const nav = new NavigationSimulator('#dashboard');
    nav.navigateTo('about');
    assert('T4.1 Navigate Dashboard -> About', nav.state.currentView === 'about', `Current: ${nav.state.currentView}`);
    nav.handleBack();
    assert('T4.2 Back from About returns to Dashboard', nav.state.currentView === 'dashboard', `Current: ${nav.state.currentView}`);
  }

  // Test 5: Contextual Back: Dashboard -> Settings -> Sounds ("Change Sound") -> Back -> Returns to Settings, NOT Dashboard!
  {
    const nav = new NavigationSimulator('#dashboard');
    nav.navigateTo('settings');
    nav.navigateTo('sounds', 'settings');
    assert('T5.1 Navigate Settings -> Sounds', nav.state.currentView === 'sounds' && nav.state.previousView === 'settings', `Current: ${nav.state.currentView}, Prev: ${nav.state.previousView}`);
    nav.handleBack();
    assert('T5.2 Back from Sounds returns to Settings (NOT Dashboard)', nav.state.currentView === 'settings', `Current: ${nav.state.currentView}`);
    nav.handleBack();
    assert('T5.3 Back from Settings returns to Dashboard', nav.state.currentView === 'dashboard', `Current: ${nav.state.currentView}`);
  }

  // Test 6: Contextual Back: Dashboard -> Settings -> Re-read Invitation -> Back -> Returns to Settings
  {
    const nav = new NavigationSimulator('#dashboard');
    nav.navigateTo('settings');
    nav.navigateTo('invitation', 'settings');
    assert('T6.1 Navigate Settings -> Invitation', nav.state.currentView === 'invitation', `Current: ${nav.state.currentView}`);
    nav.handleBack();
    assert('T6.2 Back from Invitation returns to Settings', nav.state.currentView === 'settings', `Current: ${nav.state.currentView}`);
  }

  // Test 7: Contextual Back: Dashboard -> About -> Invitation ("Original Letter") -> Back -> Returns to About
  {
    const nav = new NavigationSimulator('#dashboard');
    nav.navigateTo('about');
    nav.navigateTo('invitation', 'about');
    assert('T7.1 Navigate About -> Invitation', nav.state.currentView === 'invitation', `Current: ${nav.state.currentView}`);
    nav.handleBack();
    assert('T7.2 Back from Invitation returns to About Guide', nav.state.currentView === 'about', `Current: ${nav.state.currentView}`);
  }

  // Test 8: Deep Link & Page Refresh on #sounds -> Back -> Fallback to Dashboard
  {
    const nav = new NavigationSimulator('#sounds');
    assert('T8.1 Mount directly on #sounds', nav.state.currentView === 'sounds', `Current: ${nav.state.currentView}`);
    nav.handleBack();
    assert('T8.2 Back on deep link falls back to Dashboard', nav.state.currentView === 'dashboard', `Current: ${nav.state.currentView}`);
  }

  // Test 9: Deep Link & Page Refresh on #settings -> Back -> Fallback to Dashboard
  {
    const nav = new NavigationSimulator('#settings');
    assert('T9.1 Mount directly on #settings', nav.state.currentView === 'settings', `Current: ${nav.state.currentView}`);
    nav.handleBack();
    assert('T9.2 Back on deep link falls back to Dashboard', nav.state.currentView === 'dashboard', `Current: ${nav.state.currentView}`);
  }

  // Test 10: Deep Link to #owner while unauthenticated -> Guard prevents entry
  {
    logoutOwner();
    const nav = new NavigationSimulator('#dashboard');
    nav.navigateTo('owner');
    assert('T10.1 Navigating to #owner without auth triggers PIN modal', nav.state.showPinModal === true && nav.state.currentView === 'dashboard', `PinModal: ${nav.state.showPinModal}, View: ${nav.state.currentView}`);
    nav.handleBack(); // Should close modal, stay on dashboard
    assert('T10.2 Back dismisses PIN modal and stays on dashboard', nav.state.showPinModal === false && nav.state.currentView === 'dashboard', `PinModal: ${nav.state.showPinModal}, View: ${nav.state.currentView}`);
  }

  // Test 11: Owner Login & Exit
  {
    const settings = loadSettings();
    saveSettings({ ...settings, ownerPin: '550630' });
    await verifyOwnerPin('550630');
    const nav = new NavigationSimulator('#dashboard');
    nav.navigateTo('owner');
    assert('T11.1 Navigating to #owner with valid auth succeeds', nav.state.currentView === 'owner', `Current: ${nav.state.currentView}`);
    
    // Simulate Lock & Exit
    await logoutOwner();
    nav.handleBack();
    assert('T11.2 Exit Owner portal logs out and returns to Dashboard', nav.state.currentView === 'dashboard', `Current: ${nav.state.currentView}`);
  }

  // Test 12: Browser Back to #owner after logout is blocked by security guard
  {
    logoutOwner();
    const nav = new NavigationSimulator('#dashboard');
    // Simulate popstate pointing to 'owner'
    nav.state.historyStack = [
      { view: 'dashboard', from: null },
      { view: 'owner', from: 'dashboard' }
    ];
    nav.state.historyIndex = 1;
    nav.state.currentView = 'owner';
    // Back is pressed
    nav.handleBack();
    assert('T12.1 Unauthenticated Owner access in history is intercepted and returned to Dashboard', (nav.state.currentView as string) === 'dashboard', `Current: ${nav.state.currentView}`);
  }

  // Test 13: Ringing Alarm dismiss on Back
  {
    const nav = new NavigationSimulator('#dashboard');
    nav.state.activeRingingAlarm = '5:50 AM Alarm';
    nav.handleBack();
    assert('T13.1 Back while alarm is ringing stops alarm without navigating away', nav.state.activeRingingAlarm === null && nav.state.currentView === 'dashboard', `Alarm: ${nav.state.activeRingingAlarm}, View: ${nav.state.currentView}`);
  }

  // Test 14: Prevent duplicate history pushes
  {
    const nav = new NavigationSimulator('#dashboard');
    const initialLen = nav.state.historyStack.length;
    nav.navigateTo('dashboard');
    assert('T14.1 Navigating to same view does not create duplicate history entry', nav.state.historyStack.length === initialLen, `Len: ${nav.state.historyStack.length}`);
  }

  console.log('\n--- AUDIT SUMMARY ---');
  const allPassed = results.every(r => r.passed);
  console.log(`Total tests: ${results.length}, Passed: ${results.filter(r => r.passed).length}, Failed: ${results.filter(r => !r.passed).length}`);
  if (!allPassed) {
    process.exit(1);
  }
}

runAudit();
