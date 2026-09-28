import os
import paramiko

VPS_HOST = "36.50.176.64"
VPS_USER = "root"
VPS_PASS = "Propao123pro!"

NEW_KEY = os.environ.get("GEMINI_API_KEY", "")
NEW_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS)

stdin, stdout, stderr = ssh.exec_command('cat /etc/systemd/system/marketlink.service')
content = stdout.read().decode('utf-8')

new_lines = []
has_model = False
for line in content.splitlines():
    if line.startswith('Environment="GEMINI_API_KEY='):
        new_lines.append(f'Environment="GEMINI_API_KEY={NEW_KEY}"')
    elif line.startswith('Environment="GEMINI_MODEL='):
        new_lines.append(f'Environment="GEMINI_MODEL={NEW_MODEL}"')
        has_model = True
    else:
        new_lines.append(line)

if not has_model:
    idx = next((i for i, l in enumerate(new_lines) if l.startswith('ExecStart=')), len(new_lines))
    new_lines.insert(idx, f'Environment="GEMINI_MODEL={NEW_MODEL}"')

new_content = '\n'.join(new_lines) + '\n'

sftp = ssh.open_sftp()
with sftp.file('/etc/systemd/system/marketlink.service', 'w') as f:
    f.write(new_content)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('systemctl daemon-reload && systemctl restart marketlink && sleep 3 && systemctl is-active marketlink')
status = stdout.read().decode('utf-8').strip()
print('Service status on VPS:', status)
ssh.close()
