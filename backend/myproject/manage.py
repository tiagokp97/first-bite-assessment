import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  
PARENT_DIR = os.path.dirname(BASE_DIR)

sys.path.insert(0, PARENT_DIR)

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.project_core.settings')

    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
