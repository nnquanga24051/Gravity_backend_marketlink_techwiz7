import os
import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
jar_path = os.path.join(project_dir, "target", "marketlink-0.0.1-SNAPSHOT.jar")

if not os.path.exists(jar_path):
    print(f"Lỗi: Không tìm thấy file {jar_path}")
    print("Vui lòng chạy './mvnw clean package -DskipTests' trước!")
    sys.exit(1)

VPS_HOST = "36.50.176.64"
VPS_USER = "root"
VPS_PASS = "Propao123pro!"
REMOTE_JAR = "/var/www/marketlink/app/marketlink.jar"

print(f"Đang kết nối tới VPS {VPS_HOST} qua SFTP...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS)

sftp = ssh.open_sftp()
file_size_mb = os.path.getsize(jar_path) / (1024 * 1024)
print(f"Đang tải file JAR ({file_size_mb:.2f} MB) lên {REMOTE_JAR}...")

sftp.put(jar_path, REMOTE_JAR)
sftp.close()
print("Đã tải file JAR lên VPS thành công!")

print("Đang khởi động lại dịch vụ backend (marketlink.service)...")
stdin, stdout, stderr = ssh.exec_command("systemctl restart marketlink && sleep 2 && systemctl is-active marketlink")
status = stdout.read().decode('utf-8').strip()
err = stderr.read().decode('utf-8').strip()

if status == "active":
    print("✅ Backend Spring Boot đã được khởi động lại thành công và đang hoạt động (ACTIVE)!")
else:
    print(f"⚠️ Trạng thái service: {status}")
    if err:
        print("Chi tiết:", err)

ssh.close()
print("Backend deployment complete!")
