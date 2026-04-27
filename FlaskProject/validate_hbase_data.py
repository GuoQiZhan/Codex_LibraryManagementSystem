#!/usr/bin/env python3
"""
HBase数据准确性验证脚本
用于对比HBase Shell查询结果与应用程序获取结果
"""

import sys
import os
import json
from models.hbase_dal import HBaseDAL, HBASE_AVAILABLE

class HBaseDataAccuracyValidator:
    """HBase数据准确性验证器"""
    
    def __init__(self, host='localhost', port=9090, table_name='book'):
        """初始化验证器"""
        self.hbase_dal = HBaseDAL(host, port, table_name)
        self.connected = self.hbase_dal.connect()
        self.validation_results = []
    
    def validate_table_structure(self):
        """验证表结构"""
        print("=== 验证HBase表结构 ===")
        if HBASE_AVAILABLE and self.connected:
            print("[INFO] 连接到HBase成功，可以验证表结构")
            print("[INFO] 建议在HBase Shell中执行以下命令查看表结构：")
            print("  describe 'book'")
            print("[INFO] 预期表结构应该包含以下列族：")
            print("  - info: 包含图书基本信息（isbn, title, author, publisher, publish_year, category_name, description）")
            print("  - stock: 包含库存信息（total_stock, available_stock）")
            print("  - ext: 包含扩展信息（price, hot_score, borrow_count）")
        else:
            print("[INFO] 使用模拟数据，表结构基于预设模型")
        
        self.validation_results.append({"test": "table_structure", "status": "info", "message": "表结构验证完成"})
    
    def validate_data_retrieval(self):
        """验证数据获取准确性"""
        print("\n=== 验证数据获取准确性 ===")
        
        # 测试用例：使用用户提供的测试数据
        test_cases = [
            {
                "name": "测试图书《活着》",
                "isbn": "9787020171356",
                "expected": {
                    "title": "活着",
                    "author": "余华",
                    "publisher": "人民文学出版社",
                    "publish_year": "2012",
                    "category_name": "文学",
                    "description": "讲述人一生的苦难与坚韧",
                    "total_stock": "30",
                    "available_stock": "22",
                    "price": "39.8",
                    "hot_score": "98",
                    "borrow_count": "156"
                }
            },
            {
                "name": "测试图书《红楼梦》",
                "isbn": "9787020002207",
                "expected": {
                    "title": "红楼梦",
                    "author": "曹雪芹",
                    "publisher": "人民文学出版社",
                    "category_name": "文学"
                }
            }
        ]
        
        for test_case in test_cases:
            print(f"\n[TEST] {test_case['name']}")
            print(f"[INFO] ISBN: {test_case['isbn']}")
            
            # 从应用程序获取数据
            book_data = self.hbase_dal.get_book_by_isbn(test_case['isbn'])
            
            if book_data:
                print("[OK] 成功获取图书数据:")
                for key, value in book_data.items():
                    print(f"  {key}: {value}")
                
                # 验证关键字段
                expected = test_case['expected']
                mismatches = []
                
                for field, expected_value in expected.items():
                    actual_value = book_data.get(field)
                    if actual_value != expected_value:
                        mismatches.append(f"{field}: 预期 '{expected_value}', 实际 '{actual_value}'")
                
                if mismatches:
                    print("[ERROR] 数据不匹配:")
                    for mismatch in mismatches:
                        print(f"  {mismatch}")
                    self.validation_results.append({"test": "data_retrieval", "status": "fail", "message": f"{test_case['name']}数据不匹配"})
                else:
                    print("[OK] 数据匹配预期")
                    self.validation_results.append({"test": "data_retrieval", "status": "pass", "message": f"{test_case['name']}数据匹配"})
            else:
                print("[ERROR] 未能获取图书数据")
                self.validation_results.append({"test": "data_retrieval", "status": "fail", "message": f"{test_case['name']}未能获取数据"})
    
    def validate_scan_results(self):
        """验证扫描结果"""
        print("\n=== 验证扫描结果 ===")
        
        # 扫描图书列表
        books = self.hbase_dal.scan_books(10)
        print(f"[INFO] 扫描获取到 {len(books)} 本图书")
        
        if books:
            print("[OK] 扫描成功，前5本图书:")
            for i, book in enumerate(books[:5]):
                print(f"{i+1}. {book.get('title', 'N/A')} (ISBN: {book.get('isbn', 'N/A')})")
            
            # 验证数据完整性
            valid_books = [book for book in books if 'isbn' in book and 'title' in book]
            if len(valid_books) == len(books):
                print("[OK] 所有图书数据完整")
                self.validation_results.append({"test": "scan_results", "status": "pass", "message": "扫描结果完整"})
            else:
                print(f"[ERROR] 部分图书数据不完整，完整: {len(valid_books)}/{len(books)}")
                self.validation_results.append({"test": "scan_results", "status": "fail", "message": "扫描结果不完整"})
        else:
            print("[ERROR] 扫描失败，未获取到图书数据")
            self.validation_results.append({"test": "scan_results", "status": "fail", "message": "扫描失败"})
    
    def validate_category_filtering(self):
        """验证分类过滤"""
        print("\n=== 验证分类过滤 ===")
        
        # 测试文学类图书
        literary_books = self.hbase_dal.get_books_by_category('文学', 10)
        print(f"[INFO] 文学类图书: {len(literary_books)} 本")
        
        if literary_books:
            print("[OK] 成功获取文学类图书:")
            for i, book in enumerate(literary_books[:5]):
                print(f"{i+1}. {book.get('title', 'N/A')} (ISBN: {book.get('isbn', 'N/A')})")
            
            # 验证分类正确性
            correct_category = all(book.get('category_name') == '文学' for book in literary_books)
            if correct_category:
                print("[OK] 所有图书分类正确")
                self.validation_results.append({"test": "category_filtering", "status": "pass", "message": "分类过滤正确"})
            else:
                print("[ERROR] 部分图书分类不正确")
                self.validation_results.append({"test": "category_filtering", "status": "fail", "message": "分类过滤不正确"})
        else:
            print("[ERROR] 未能获取文学类图书")
            self.validation_results.append({"test": "category_filtering", "status": "fail", "message": "未能获取分类图书"})
    
    def generate_hbase_shell_commands(self):
        """生成HBase Shell命令用于对比"""
        print("\n=== HBase Shell 对比命令 ===")
        commands = [
            "# 创建表（如果不存在）",
            "create 'book', 'info', 'stock', 'ext'",
            "",
            "# 插入测试数据",
            "put 'book', '1', 'info:isbn', '9787020171356'",
            "put 'book', '1', 'info:title', '活着'",
            "put 'book', '1', 'info:author', '余华'",
            "put 'book', '1', 'info:publisher', '人民文学出版社'",
            "put 'book', '1', 'info:publish_year', '2012'",
            "put 'book', '1', 'info:category_name', '文学'",
            "put 'book', '1', 'info:description', '讲述人一生的苦难与坚韧'",
            "put 'book', '1', 'stock:total_stock', '30'",
            "put 'book', '1', 'stock:available_stock', '22'",
            "put 'book', '1', 'ext:price', '39.8'",
            "put 'book', '1', 'ext:hot_score', '98'",
            "put 'book', '1', 'ext:borrow_count', '156'",
            "",
            "# 查询单条记录",
            "get 'book', '1'",
            "",
            "# 按ISBN查询（如果ISBN是rowkey）",
            "get 'book', '9787020171356'",
            "",
            "# 扫描所有记录",
            "scan 'book'",
            "",
            "# 按分类过滤",
            "scan 'book', FILTER => \"SingleColumnValueFilter('info', 'category_name', =, 'binary:文学')\""
        ]
        
        for cmd in commands:
            print(cmd)
    
    def print_validation_summary(self):
        """打印验证总结"""
        print("\n=== 验证总结 ===")
        print(f"HBase可用: {HBASE_AVAILABLE}")
        print(f"连接状态: {'已连接' if self.connected else '未连接'}")
        print()
        
        pass_count = sum(1 for r in self.validation_results if r['status'] == 'pass')
        fail_count = sum(1 for r in self.validation_results if r['status'] == 'fail')
        info_count = sum(1 for r in self.validation_results if r['status'] == 'info')
        
        print(f"通过: {pass_count}")
        print(f"失败: {fail_count}")
        print(f"信息: {info_count}")
        print()
        
        for result in self.validation_results:
            status_icon = "[OK]" if result['status'] == 'pass' else "[ERROR]" if result['status'] == 'fail' else "[INFO]"
            print(f"{status_icon} {result['test']}: {result['message']}")
        
        print()
        if fail_count > 0:
            print("[ERROR] 存在验证失败，需要检查HBase数据和配置")
        else:
            print("[OK] 所有验证通过")
    
    def run_validation(self):
        """运行完整验证"""
        self.validate_table_structure()
        self.validate_data_retrieval()
        self.validate_scan_results()
        self.validate_category_filtering()
        self.generate_hbase_shell_commands()
        self.print_validation_summary()

if __name__ == '__main__':
    print("HBase数据准确性验证")
    print("=" * 60)
    
    validator = HBaseDataAccuracyValidator()
    validator.run_validation()
    
    print("\n" + "=" * 60)
    print("验证完成。请使用上述HBase Shell命令在真实HBase环境中执行")
    print("并将结果与应用程序获取的结果进行对比，确保数据准确性。")