import os
import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
dist_dir = os.path.join(project_dir, "frontend", "dist")

if not os.path.exists(dist_dir):
    print("Lỗi: Thư mục frontend/dist không tồn tại. Vui lòng chạy 'npm run build' trước!")
    sys.exit(1)

VPS_HOST = "36.50.176.64"
VPS_USER = "root"
VPS_PASS = "Propao123pro!"
REMOTE_PATH = "/var/www/marketlink/frontend"

print(f"Đang kết nối tới VPS {VPS_HOST} qua SFTP...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS)

sftp = ssh.open_sftp()

# Đảm bảo thư mục đích tồn tại
stdin, stdout, stderr = ssh.exec_command(f"mkdir -p {REMOTE_PATH}")
stdout.channel.recv_exit_status()

def upload_dir(local_dir, remote_dir):
    count = 0
    for root, dirs, files in os.walk(local_dir):
        rel_path = os.path.relpath(root, local_dir)
        curr_remote = remote_dir if rel_path == '.' else os.path.join(remote_dir, rel_path).replace('\\', '/')
        try:
            sftp.mkdir(curr_remote)
        except IOError:
            pass
        for f in files:
            local_file = os.path.join(root, f)
            remote_file = os.path.join(curr_remote, f).replace('\\', '/')
            sftp.put(local_file, remote_file)
            count += 1
    return count

print("Đang tải các tệp giao diện mới lên VPS...")
uploaded_count = upload_dir(dist_dir, REMOTE_PATH)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("systemctl reload nginx")
stdout.channel.recv_exit_status()
ssh.close()

print(f"Đã tải lên {uploaded_count} tệp và reload Nginx thành công!")
