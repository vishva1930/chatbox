try {
    Add-Type -Path "c:\Users\guruv\OneDrive\Documents\chatbox\backend\target\chatbox-1.0.0.jar"
    $connectionString = "jdbc:mysql://localhost:3306/chatbox?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
    $user = "root"
    $pass = "vishva@63839"
    $driver = [com.mysql.cj.jdbc.Driver]::new()
    $props = [java.util.Properties]::new()
    $props.setProperty("user", $user)
    $props.setProperty("password", $pass)
    $conn = $driver.connect($connectionString, $props)
    if ($conn) {
        Write-Output "Connection successful!"
        $conn.close()
    }
} catch {
    Write-Error $_.Exception.Message
    Write-Error $_.Exception.StackTrace
}
