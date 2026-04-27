#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""HBase连接测试脚本"""

import sys
import socket

def test_hbase_connection(host='192.168.10.99', port=9090):
    print("Testing connection to HBase Thrift server: %s:%d" % (host, port))
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        
        if result == 0:
            print("SUCCESS: Connected to HBase Thrift server")
            sock.close()
            return True
        else:
            print("FAILED: Cannot connect to HBase Thrift server")
            print("Please make sure HBase Thrift service is running")
            sock.close()
            return False
    except Exception as e:
        print("ERROR: Connection test failed - %s" % str(e))
        return False

def try_import_happybase():
    print("\nTesting happybase module...")
    try:
        import happybase
        print("SUCCESS: happybase module is available")
        return True
    except ImportError as e:
        print("FAILED: Cannot import happybase - %s" % str(e))
        return False

def main():
    print("=" * 50)
    print("HBase Connection Diagnostics")
    print("=" * 50)
    
    happybase_ok = try_import_happybase()
    
    print("\n" + "-" * 50)
    conn_ok = test_hbase_connection()
    
    print("\n" + "=" * 50)
    if happybase_ok and conn_ok:
        print("All tests passed. Application can start.")
        return 0
    else:
        print("Tests failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
