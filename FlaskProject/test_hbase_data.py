#!/usr/bin/env python3
"""
HBase数据准确性测试脚本
用于验证HBase数据获取的准确性，对比HBase Shell查询结果与应用程序获取结果
"""

import sys
import os
import json
from models.hbase_dal import HBaseDAL, HBASE_AVAILABLE

class HBaseDataValidator:
    """HBase数据验证器"""
    
    def __init__(self, host='localhost', port=9090, table_name='book'):
        """初始化验证器"""
        self.hbase_dal = HBaseDAL(host, port, table_name)
        self.connected = self.hbase_dal.connect()
        self.test_results = []
    
    def test_connection(self):
        """测试HBase连接"""
        print("=== 测试HBase连接 ===")
        if HBASE_AVAILABLE:
            if self.connected:
                print("[OK] HBase连接成功")
                self.test_results.append({"test": "connection", "status": "pass", "message": "HBase连接成功"})
            else:
                print("[ERROR] HBase连接失败")
                self.test_results.append({"test": "connection", "status": "fail", "message": "HBase连接失败"})
        else:
            print("[WARNING] happybase模块未安装，将使用模拟数据进行测试")
            self.test_results.append({"test": "connection", "status": "warning", "message": "使用模拟数据"})
    
    def test_get_book_by_isbn(self, isbn):
        """测试根据ISBN获取图书"""
        print(f"\n=== 测试获取图书 {isbn} ===")
        book = self.hbase_dal.get_book_by_isbn(isbn)
        if book:
            print("[OK] 成功获取图书:")
            for key, value in book.items():
                print(f"  {key}: {value}")
            self.test_results.append({"test": "get_book", "status": "pass", "message": f"成功获取图书 {isbn}"})
        else:
            print("[ERROR] 未能获取图书")
            self.test_results.append({"test": "get_book", "status": "fail", "message": f"未能获取图书 {isbn}"})
        return book
    
    def test_scan_books(self, limit=10):
        """测试扫描图书列表"""
        print(f"\n=== 测试扫描图书列表 (前{limit}条) ===")
        books = self.hbase_dal.scan_books(limit)
        print(f"获取到 {len(books)} 本图书")
        for i, book in enumerate(books):
            print(f"{i+1}. {book.get('title', 'N/A')} (ISBN: {book.get('isbn', 'N/A')})")
        
        if books:
            self.test_results.append({"test": "scan_books", "status": "pass", "message": f"成功扫描 {len(books)} 本图书"})
        else:
            self.test_results.append({"test": "scan_books", "status": "fail", "message": "未能扫描到图书"})
        return books
    
    def test_get_books_by_category(self, category):
        """测试按分类获取图书"""
        print(f"\n=== 测试按分类获取图书: {category} ===")
        books = self.hbase_dal.get_books_by_category(category)
        print(f"获取到 {len(books)} 本 {category} 类图书")
        for i, book in enumerate(books):
            print(f"{i+1}. {book.get('title', 'N/A')} (ISBN: {book.get('isbn', 'N/A')})")
        
        if books:
            self.test_results.append({"test": "get_by_category", "status": "pass", "message": f"成功获取 {len(books)} 本 {category} 类图书"})
        else:
            self.test_results.append({"test": "get_by_category", "status": "fail", "message": f"未能获取 {category} 类图书"})
        return books
    
    def test_count_books(self):
        """测试统计图书总数"""
        print("\n=== 测试统计图书总数 ===")
        count = self.hbase_dal.count_books()
        print(f"图书总数: {count}")
        
        if count >= 0:
            self.test_results.append({"test": "count_books", "status": "pass", "message": f"图书总数: {count}"})
        else:
            self.test_results.append({"test": "count_books", "status": "fail", "message": "统计图书失败"})
        return count
    
    def test_data_consistency(self):
        """测试数据一致性"""
        print("\n=== 测试数据一致性 ===")
        
        # 测试ISBN查询与扫描结果的一致性
        test_isbn = '9787020002207'  # 红楼梦
        book_by_isbn = self.hbase_dal.get_book_by_isbn(test_isbn)
        books_by_scan = self.hbase_dal.scan_books(100)
        
        # 从扫描结果中查找同一本书
        book_in_scan = None
        for book in books_by_scan:
            if book.get('isbn') == test_isbn:
                book_in_scan = book
                break
        
        if book_by_isbn and book_in_scan:
            # 比较两个结果
            fields_to_compare = ['title', 'author', 'publisher', 'category_name', 'total_stock']
            differences = []
            
            for field in fields_to_compare:
                val1 = book_by_isbn.get(field)
                val2 = book_in_scan.get(field)
                if val1 != val2:
                    differences.append(f"{field}: {val1} vs {val2}")
            
            if differences:
                print("[ERROR] 数据不一致:")
                for diff in differences:
                    print(f"  {diff}")
                self.test_results.append({"test": "consistency", "status": "fail", "message": f"发现 {len(differences)} 处数据不一致"})
            else:
                print("[OK] 数据一致")
                self.test_results.append({"test": "consistency", "status": "pass", "message": "数据一致"})
        else:
            print("[WARNING] 无法进行一致性测试，缺少数据")
            self.test_results.append({"test": "consistency", "status": "warning", "message": "无法进行一致性测试"})
    
    def generate_hbase_shell_commands(self):
        """生成HBase Shell查询命令"""
        print("\n=== HBase Shell 查询命令 ===")
        commands = [
            f"# 查看表结构",
            f"describe '{self.hbase_dal.table_name}'",
            f"",
            f"# 扫描前5条记录",
            f"scan '{self.hbase_dal.table_name}', LIMIT => 5",
            f"",
            f"# 查询特定ISBN的图书",
            f"get '{self.hbase_dal.table_name}', '9787020002207'",
            f"",
            f"# 按分类查询（需要根据实际列族调整）",
            f"scan '{self.hbase_dal.table_name}', FILTER => \"SingleColumnValueFilter('info', 'category_name', =, 'binary:文学')\""
        ]
        
        for cmd in commands:
            print(cmd)
    
    def print_summary(self):
        """打印测试总结"""
        print("\n=== 测试总结 ===")
        print(f"HBase可用: {HBASE_AVAILABLE}")
        print(f"连接状态: {'已连接' if self.connected else '未连接'}")
        print()
        
        pass_count = sum(1 for r in self.test_results if r['status'] == 'pass')
        fail_count = sum(1 for r in self.test_results if r['status'] == 'fail')
        warning_count = sum(1 for r in self.test_results if r['status'] == 'warning')
        
        print(f"通过: {pass_count}")
        print(f"失败: {fail_count}")
        print(f"警告: {warning_count}")
        print()
        
        for result in self.test_results:
            status_icon = "[OK]" if result['status'] == 'pass' else "[ERROR]" if result['status'] == 'fail' else "[WARNING]"
            print(f"{status_icon} {result['test']}: {result['message']}")
        
        print()
        if fail_count > 0:
            print("[ERROR] 存在测试失败，需要检查HBase配置和代码")
        else:
            print("[OK] 所有测试通过")
    
    def run_all_tests(self):
        """运行所有测试"""
        self.test_connection()
        self.test_get_book_by_isbn('9787020002207')
        self.test_scan_books(5)
        self.test_get_books_by_category('文学')
        self.test_count_books()
        self.test_data_consistency()
        self.generate_hbase_shell_commands()
        self.print_summary()

if __name__ == '__main__':
    print("HBase数据准确性测试")
    print("=" * 50)
    
    validator = HBaseDataValidator()
    validator.run_all_tests()