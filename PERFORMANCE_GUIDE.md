# Performance Profiling Guide

## Step 1: Enable React DevTools Profiler

1. **Install React DevTools Extension** (if not already installed):
   - Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

2. **Open Developer Tools** (F12)
3. **Navigate to Components tab**
4. **Look for Profiler tab** (next to Components)

## Step 2: Profile Sidebar Toggle Performance

### React Profiler Test:
1. **Go to Attendance Management page** (complex page with tables)
2. **Open React Profiler tab**
3. **Click record button** (circle icon)
4. **Toggle sidebar** (collapse/expand button) 3-4 times
5. **Click stop recording**

### What to Look For:
- **Flame Graph**: Shows which components re-rendered
- **Ranked Chart**: Shows render times (look for slow components)
- **Component Tree**: Shows render counts per component

### Expected Results After Optimization:
- ✅ `MainContent` should NOT re-render when sidebar toggles
- ✅ `AttendanceManagement` should NOT re-render when sidebar toggles
- ❌ Only `Layout` should re-render (for sidebar state)

## Step 3: Chrome Performance Tab Test

### Performance Tab Test:
1. **Go to Performance tab** in DevTools
2. **Click record** (circle button)
3. **Toggle sidebar** 5-6 times quickly
4. **Stop recording**

### What to Look For:
- **Purple bars** = Layout operations (expensive!)
- **Green bars** = Paint operations
- **Yellow bars** = JavaScript execution

### Expected Results:
- ✅ **Minimal purple bars** = Good CSS performance
- ❌ **Large purple bars** = Layout thrashing (need CSS optimization)

## Step 4: Console Monitoring

### Check Console Output:
Open browser console (F12 → Console) and look for:

**Before Optimization:**
```
🔄 AttendanceManagement component is re-rendering!
🧮 Calculating net salary...
🔍 Filtering employees...
📡 Fetching data...
```

**After Optimization:**
```
Main Content is Re-rendering! This is slow!  // Only when sidebarCollapsed changes
```

## Step 5: Performance Metrics

### Key Metrics to Monitor:
1. **Component Re-render Count**: Should be minimal
2. **Layout Operations**: Should be minimal (purple bars)
3. **JavaScript Execution Time**: Should be fast
4. **Memory Usage**: Should be stable

## Step 6: Additional Optimizations

### If You See Issues:

#### Many Components Re-rendering:
- Apply `React.memo` to more components
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers

#### Large Purple "Layout" Bars:
- Use `transform` instead of changing `width/height`
- Use `will-change: transform` CSS property
- Avoid changing layout properties in animations

#### High JavaScript Execution:
- Optimize expensive functions
- Use `useMemo` for computed values
- Debounce user input handlers

## Step 7: Test Different Scenarios

### Test Cases:
1. **Sidebar Toggle**: Should be fast
2. **Page Navigation**: Should be smooth
3. **Form Interactions**: Should be responsive
4. **Table Scrolling**: Should be smooth
5. **Modal Opening**: Should be fast

## Step 8: Performance Budget

### Target Metrics:
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

## Step 9: Monitoring Tools

### Built-in Tools:
- React DevTools Profiler
- Chrome Performance Tab
- Chrome Lighthouse
- Chrome Memory Tab

### Additional Tools:
- React Profiler API
- Performance Observer API
- Web Vitals library

## Step 10: Optimization Checklist

### React Optimizations:
- [ ] `React.memo` for stable components
- [ ] `useMemo` for expensive calculations
- [ ] `useCallback` for event handlers
- [ ] Proper dependency arrays
- [ ] Avoid inline objects/functions

### CSS Optimizations:
- [ ] Use `transform` for animations
- [ ] Avoid layout thrashing
- [ ] Use `will-change` property
- [ ] Optimize selectors
- [ ] Use CSS containment

### JavaScript Optimizations:
- [ ] Debounce user input
- [ ] Virtualize long lists
- [ ] Lazy load components
- [ ] Optimize bundle size
- [ ] Use code splitting
