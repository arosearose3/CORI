<script>
    export let systemMetrics = {};
  </script>
  
  <div>
    <p>Uptime: {systemMetrics.uptime} hours</p>
    <p>CPU Usage: {systemMetrics.cpuUsage}%</p>
    <p>Memory Usage: {systemMetrics.memoryUsage}%</p>
  </div>
  