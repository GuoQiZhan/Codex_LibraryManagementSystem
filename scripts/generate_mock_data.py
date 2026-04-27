#!/usr/bin/env python3
"""
图书馆管理系统 - 模拟数据生成脚本
生成1万条模拟数据并导出为Excel文件

数据包括：
1. 读者数据：2,000条
2. 图书数据：5,000条
3. 借阅记录：10,000条
4. 预约记录：500条（可选）
5. 罚款记录：300条（可选）
"""

import os
import sys
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from faker import Faker
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

# 添加项目路径以便导入模型
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class MockDataGenerator:
    """模拟数据生成器"""

    def __init__(self, seed=42):
        """初始化生成器"""
        self.faker = Faker('zh_CN')
        self.faker_en = Faker('en_US')  # 用于生成英文作者名
        random.seed(seed)
        np.random.seed(seed)

        # 图书类别定义（中图法22个大类）
        self.categories = {
            'A': '马列主义、毛泽东思想、邓小平理论',
            'B': '哲学、宗教',
            'C': '社会科学总论',
            'D': '政治、法律',
            'E': '军事',
            'F': '经济',
            'G': '文化、科学、教育、体育',
            'H': '语言、文字',
            'I': '文学',
            'J': '艺术',
            'K': '历史、地理',
            'N': '自然科学总论',
            'O': '数理科学和化学',
            'P': '天文学、地球科学',
            'Q': '生物科学',
            'R': '医药、卫生',
            'S': '农业科学',
            'T': '工业技术',
            'U': '交通运输',
            'V': '航空、航天',
            'X': '环境科学、安全科学',
            'Z': '综合性图书'
        }

        # 热门类别分布（根据PRD要求）
        self.category_distribution = {
            'TP': '自动化技术、计算机技术',  # 计算机类 - 30%
            'I': '文学',                     # 文学类 - 25%
            'F': '经济',                     # 经济管理类 - 15%
            'TB': '一般工业技术',            # 工程技术类 - 10%
            '其他': '其他类别'               # 其他类别 - 20%
        }

        # 作者库（中文和英文作者）
        self.chinese_authors = [
            '鲁迅', '老舍', '巴金', '茅盾', '沈从文', '钱钟书', '张爱玲', '余华', '莫言', '贾平凹',
            '王小波', '路遥', '陈忠实', '刘慈欣', '金庸', '古龙', '梁羽生', '琼瑶', '三毛', '席慕容'
        ]

        self.foreign_authors = [
            'William Shakespeare', 'Jane Austen', 'Charles Dickens', 'Leo Tolstoy',
            'Fyodor Dostoevsky', 'Ernest Hemingway', 'Mark Twain', 'George Orwell',
            'J.K. Rowling', 'Stephen King', 'Agatha Christie', 'J.R.R. Tolkien',
            'Haruki Murakami', 'Gabriel Garcia Marquez', 'Paulo Coelho'
        ]

        # 出版社列表
        self.publishers = [
            '人民文学出版社', '商务印书馆', '中华书局', '三联书店', '科学出版社',
            '高等教育出版社', '机械工业出版社', '电子工业出版社', '清华大学出版社',
            '北京大学出版社', '中国人民大学出版社', '复旦大学出版社', '上海人民出版社'
        ]

        # 图书关键词（用于生成书名）
        self.book_keywords = {
            'TP': ['Python', 'Java', '算法', '数据结构', '人工智能', '机器学习', '深度学习', '数据库', '网络', '编程'],
            'I': ['小说', '散文', '诗歌', '传记', '历史', '爱情', '悬疑', '科幻', '武侠', '都市'],
            'F': ['经济学', '管理学', '金融', '投资', '会计', '市场营销', '创业', '商业', '战略', '人力资源'],
            'TB': ['工程', '设计', '制造', '材料', '机械', '电子', '电气', '自动化', '建筑', '环境'],
            '其他': ['基础', '原理', '导论', '教程', '手册', '指南', '经典', '现代', '实用', '高级']
        }

    def _calculate_quota(self, credit_score):
        """根据信用分计算借书额度"""
        if credit_score >= 90:
            return 10
        elif credit_score >= 80:
            return 8
        elif credit_score >= 70:
            return 6
        elif credit_score >= 60:
            return 5
        else:
            return 0

    def generate_readers(self, count=2000):
        """生成读者数据"""
        print(f"生成 {count} 条读者数据...")
        readers = []

        for i in tqdm(range(1, count + 1)):
            reader_id = f'R2023{i:04d}'
            credit_score = np.random.randint(60, 101)

            # 逾期次数：幂律分布（大部分读者0-1次，少数多次）
            overdue_count = np.random.poisson(0.5)
            overdue_count = min(overdue_count, 5)  # 最多5次

            # 总借阅次数：0-50次，但受信用分影响
            base_borrow = np.random.randint(0, 51)
            # 信用分高的读者借阅更多
            credit_factor = credit_score / 100
            total_borrow_count = int(base_borrow * (0.5 + credit_factor * 0.5))

            # 最后活跃时间：近1年随机，但活跃读者更近期
            days_ago = np.random.beta(2, 5) * 365  # Beta分布，偏向近期
            last_active = datetime.now() - timedelta(days=days_ago)

            readers.append({
                'reader_id': reader_id,
                'name': self.faker.name(),
                'email': self.faker.email() if np.random.random() > 0.3 else None,  # 70%有邮箱
                'phone': self.faker.phone_number() if np.random.random() > 0.2 else None,  # 80%有电话
                'credit_score': credit_score,
                'borrow_quota': self._calculate_quota(credit_score),
                'overdue_count': overdue_count,
                'total_borrow_count': total_borrow_count,
                'last_active': last_active,
                'created_at': last_active - timedelta(days=np.random.randint(1, 30)),  # 注册时间更早
                'updated_at': last_active
            })

        df = pd.DataFrame(readers)
        return df

    def generate_books(self, count=5000):
        """生成图书数据"""
        print(f"生成 {count} 条图书数据...")
        books = []

        # 确定类别分布
        category_codes = list(self.categories.keys())
        category_names = list(self.categories.values())

        for i in tqdm(range(1, count + 1)):
            # ISBN生成：978-7-xxx-xxxxx-x
            prefix = '978-7-'
            publisher_code = f'{np.random.randint(100, 1000):03d}'
            book_code = f'{np.random.randint(10000, 100000):05d}'
            check_digit = np.random.randint(0, 10)
            isbn = f'{prefix}{publisher_code}-{book_code}-{check_digit}'

            # 选择类别
            if np.random.random() < 0.7:  # 70%属于热门类别
                cat_code = random.choice(list(self.category_distribution.keys())[:4])
                cat_name = self.category_distribution[cat_code]
            else:  # 30%属于其他类别
                idx = np.random.randint(0, len(category_codes))
                cat_code = category_codes[idx]
                cat_name = category_names[idx]

            # 生成书名
            if cat_code in self.book_keywords:
                keywords = self.book_keywords[cat_code]
            else:
                keywords = self.book_keywords['其他']

            title_prefix = random.choice(['', '新编', '实用', '现代', '高级', '基础'])
            title_keyword = random.choice(keywords)
            title_suffix = random.choice(['', '教程', '导论', '原理', '应用', '实践'])

            title = f'{title_prefix}{title_keyword}{title_suffix}'
            if not title_prefix and not title_suffix:
                title = f'{title_keyword}与{random.choice(keywords)}'

            # 选择作者
            if np.random.random() < 0.6:  # 60%中文作者
                author = random.choice(self.chinese_authors)
            else:  # 40%外文作者
                author = random.choice(self.foreign_authors)

            # 库存（大部分1-3本，少数热门书更多）
            if np.random.random() < 0.1:  # 10%的热门书库存更多
                total_stock = np.random.randint(3, 11)
            else:
                total_stock = np.random.randint(1, 4)

            # 可借库存（初始等于总库存）
            available_stock = total_stock

            # 价格
            price = round(np.random.uniform(20, 150), 2)

            # 出版年份
            publish_year = np.random.randint(2000, 2026)

            # 借阅次数（长尾分布）
            borrow_count = int(np.random.pareto(2.5) * 10)
            borrow_count = min(borrow_count, 200)  # 最多200次

            # 热度分数（基于借阅次数和库存比）
            if total_stock > 0:
                borrow_ratio = borrow_count / total_stock
                hot_score = round(borrow_count * 0.7 + borrow_ratio * 100 * 0.3, 2)
            else:
                hot_score = float(borrow_count)

            books.append({
                'isbn': isbn,
                'title': title,
                'author': author,
                'publisher': random.choice(self.publishers),
                'publish_year': publish_year,
                'category_path': cat_code,
                'category_name': cat_name,
                'total_stock': total_stock,
                'available_stock': available_stock,
                'price': price,
                'language': '中文' if np.random.random() < 0.8 else '英文',
                'page_count': np.random.randint(100, 500) if np.random.random() > 0.1 else None,
                'description': f'《{title}》是一本关于{title_keyword}的{cat_name}类图书。',
                'cover_image': f'/covers/{isbn}.jpg' if np.random.random() > 0.5 else None,
                'hot_score': hot_score,
                'borrow_count': borrow_count,
                'created_at': datetime(2020 + np.random.randint(0, 6), 1, 1) + timedelta(days=np.random.randint(0, 365*5)),
                'updated_at': datetime.now() - timedelta(days=np.random.randint(0, 180))
            })

        df = pd.DataFrame(books)
        return df

    def generate_borrow_records(self, count=10000, readers_df=None, books_df=None):
        """生成借阅记录"""
        print(f"生成 {count} 条借阅记录...")

        if readers_df is None or books_df is None:
            raise ValueError("需要读者和图书数据")

        borrow_records = []
        record_id = 1

        # 确保有足够的读者和图书
        reader_ids = readers_df['reader_id'].tolist()
        book_isbns = books_df['isbn'].tolist()
        book_stocks = {isbn: books_df.loc[books_df['isbn'] == isbn, 'available_stock'].iloc[0] for isbn in book_isbns}

        # 时间范围：2024-01-01 至 2025-04-20
        start_date = datetime(2024, 1, 1)
        end_date = datetime(2025, 4, 20)
        date_range = (end_date - start_date).days

        # 生成借阅记录
        for _ in tqdm(range(count)):
            # 选择读者（80%的借阅由20%的读者产生）
            if np.random.random() < 0.8:
                # 活跃读者（借阅次数多的）
                reader_id = random.choice(reader_ids[:len(reader_ids)//5])
            else:
                reader_id = random.choice(reader_ids)

            # 选择图书（热门图书借阅频率高）
            book_idx = int(np.random.pareto(2.5) * 10) % len(book_isbns)
            isbn = book_isbns[book_idx]

            # 检查库存
            if book_stocks[isbn] <= 0:
                # 库存不足，跳过
                continue

            # 借书日期
            borrow_days_ago = np.random.randint(0, date_range)
            borrow_date = start_date + timedelta(days=borrow_days_ago)

            # 应还日期（借书日期+30天）
            due_date = borrow_date + timedelta(days=30)

            # 确定归还情况
            rand_val = np.random.random()
            if rand_val < 0.7:  # 70%正常归还
                # 在应还日期前归还
                return_days_after = np.random.randint(0, 30)
                return_date = borrow_date + timedelta(days=return_days_after)
                status = 'returned'
                fine_amount = 0.0
            elif rand_val < 0.9:  # 20%逾期归还
                # 逾期1-60天
                overdue_days = np.random.randint(1, 61)
                return_date = due_date + timedelta(days=overdue_days)
                status = 'returned'
                # 罚款：每天0.5元，最高50元
                fine_amount = min(overdue_days * 0.5, 50.0)
            else:  # 10%未归还
                return_date = None
                # 检查是否已逾期
                current_date = datetime.now()
                if current_date > due_date:
                    status = 'overdue'
                    overdue_days = (current_date - due_date).days
                    fine_amount = min(overdue_days * 0.5, 50.0)
                else:
                    status = 'borrowed'
                    fine_amount = 0.0

            # 续借次数（30%的借阅有续借）
            renew_count = 0
            if status == 'returned' and np.random.random() < 0.3:
                renew_count = np.random.randint(1, 3)

            borrow_records.append({
                'record_id': record_id,
                'reader_id': reader_id,
                'isbn': isbn,
                'borrow_date': borrow_date,
                'due_date': due_date.date(),  # 只存日期部分
                'return_date': return_date,
                'status': status,
                'renew_count': renew_count,
                'fine_amount': fine_amount,
                'actual_fine_paid': fine_amount if status == 'returned' and fine_amount > 0 else 0.0,
                'created_at': borrow_date,
                'updated_at': return_date if return_date else datetime.now()
            })

            # 更新图书库存（模拟借出）
            book_stocks[isbn] -= 1
            record_id += 1

        df = pd.DataFrame(borrow_records)
        return df

    def generate_reservations(self, count=500, readers_df=None, books_df=None):
        """生成预约记录"""
        print(f"生成 {count} 条预约记录...")

        if readers_df is None or books_df is None:
            raise ValueError("需要读者和图书数据")

        reservations = []
        reader_ids = readers_df['reader_id'].tolist()
        book_isbns = books_df['isbn'].tolist()

        # 时间范围：近6个月
        start_date = datetime.now() - timedelta(days=180)

        for i in range(1, count + 1):
            reader_id = random.choice(reader_ids)
            isbn = random.choice(book_isbns)

            # 预约日期
            reserve_days_ago = np.random.randint(0, 180)
            reserve_date = start_date + timedelta(days=reserve_days_ago)

            # 过期日期（预约后7天）
            expiry_date = reserve_date + timedelta(days=7)

            # 状态
            status_options = ['pending', 'ready', 'cancelled', 'expired']
            weights = [0.4, 0.2, 0.2, 0.2]  # 概率分布
            status = random.choices(status_options, weights=weights)[0]

            # 通知日期（如果状态为ready）
            notify_date = None
            if status == 'ready':
                notify_days_after = np.random.randint(0, 3)
                notify_date = reserve_date + timedelta(days=notify_days_after)

            reservations.append({
                'reservation_id': i,
                'reader_id': reader_id,
                'isbn': isbn,
                'reserve_date': reserve_date,
                'status': status,
                'expiry_date': expiry_date,
                'notify_date': notify_date,
                'created_at': reserve_date,
                'updated_at': reserve_date
            })

        df = pd.DataFrame(reservations)
        return df

    def generate_fines(self, count=300, readers_df=None, borrow_df=None):
        """生成罚款记录"""
        print(f"生成 {count} 条罚款记录...")

        if readers_df is None or borrow_df is None:
            raise ValueError("需要读者和借阅记录数据")

        fines = []

        # 从借阅记录中筛选有罚款的记录
        fine_records = borrow_df[borrow_df['fine_amount'] > 0].copy()

        if len(fine_records) < count:
            # 如果没有足够的罚款记录，创建一些
            fine_records = borrow_df.sample(n=min(count, len(borrow_df)), replace=True).copy()
            fine_records['fine_amount'] = fine_records['fine_amount'].apply(lambda x: x if x > 0 else np.random.uniform(5, 50))

        fine_records = fine_records.head(count)

        for i, record in enumerate(fine_records.itertuples(), 1):
            reader_id = record.reader_id
            record_id = record.record_id

            # 罚款日期（借书日期后30-90天）
            borrow_date = record.borrow_date
            if isinstance(borrow_date, str):
                borrow_date = datetime.fromisoformat(borrow_date.replace('Z', '+00:00'))

            fine_days_after = np.random.randint(30, 90)
            fine_date = borrow_date + timedelta(days=fine_days_after)

            # 状态
            status_options = ['unpaid', 'paid', 'waived']
            weights = [0.5, 0.4, 0.1]  # 概率分布
            status = random.choices(status_options, weights=weights)[0]

            # 支付日期（如果已支付）
            payment_date = None
            if status == 'paid':
                payment_days_after = np.random.randint(1, 30)
                payment_date = fine_date + timedelta(days=payment_days_after)

            # 原因
            reason_options = ['逾期归还', '图书损坏', '图书丢失', '其他']
            reason = random.choice(reason_options)

            fines.append({
                'fine_id': i,
                'reader_id': reader_id,
                'record_id': record_id,
                'amount': float(record.fine_amount),
                'fine_date': fine_date,
                'status': status,
                'payment_date': payment_date,
                'reason': reason,
                'created_at': fine_date,
                'updated_at': payment_date if payment_date else fine_date
            })

        df = pd.DataFrame(fines)
        return df

    def export_to_excel(self, data_dict, output_dir='output'):
        """将数据导出为Excel文件"""
        print(f"导出数据到Excel文件，目录: {output_dir}")

        # 创建输出目录
        os.makedirs(output_dir, exist_ok=True)

        excel_files = []

        for name, df in data_dict.items():
            if df is not None and not df.empty:
                # 格式化日期列
                for col in df.columns:
                    if df[col].dtype == 'object':
                        # 检查是否是datetime对象
                        sample = df[col].iloc[0] if len(df) > 0 else None
                        if isinstance(sample, datetime):
                            df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')

                # 保存为Excel
                filename = f"{name}.xlsx"
                filepath = os.path.join(output_dir, filename)

                with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
                    df.to_excel(writer, index=False, sheet_name=name)
                    print(f"  ✓ 已保存: {filename} ({len(df)} 行)")

                excel_files.append(filepath)

        # 创建数据汇总报告
        self._create_summary_report(data_dict, output_dir)

        print(f"\n所有数据已成功导出到 '{output_dir}' 目录")
        return excel_files

    def _create_summary_report(self, data_dict, output_dir):
        """创建数据汇总报告"""
        print("创建数据汇总报告...")

        summary_data = {}

        # 基本统计
        summary_data['数据集概览'] = pd.DataFrame({
            '数据集': list(data_dict.keys()),
            '记录数': [len(df) if df is not None else 0 for df in data_dict.values()],
            '生成时间': [datetime.now().strftime('%Y-%m-%d %H:%M:%S')] * len(data_dict)
        })

        # 读者数据统计
        if 'readers' in data_dict and data_dict['readers'] is not None:
            readers_df = data_dict['readers']
            summary_data['读者统计'] = pd.DataFrame({
                '指标': ['读者总数', '平均信用分', '平均借阅次数', '有逾期记录读者比例', '活跃读者比例'],
                '值': [
                    len(readers_df),
                    f"{readers_df['credit_score'].mean():.1f}",
                    f"{readers_df['total_borrow_count'].mean():.1f}",
                    f"{(readers_df['overdue_count'] > 0).sum() / len(readers_df) * 100:.1f}%",
                    f"{(readers_df['last_active'] > datetime.now() - timedelta(days=30)).sum() / len(readers_df) * 100:.1f}%"
                ]
            })

        # 图书数据统计
        if 'books' in data_dict and data_dict['books'] is not None:
            books_df = data_dict['books']
            summary_data['图书统计'] = pd.DataFrame({
                '指标': ['图书总数', '平均价格', '平均热度', '平均库存', '平均借阅次数'],
                '值': [
                    len(books_df),
                    f"¥{books_df['price'].mean():.2f}",
                    f"{books_df['hot_score'].mean():.2f}",
                    f"{books_df['total_stock'].mean():.1f}",
                    f"{books_df['borrow_count'].mean():.1f}"
                ]
            })

            # 类别分布
            if 'category_name' in books_df.columns:
                category_dist = books_df['category_name'].value_counts().head(10)
                summary_data['图书类别分布'] = pd.DataFrame({
                    '类别': category_dist.index.tolist(),
                    '数量': category_dist.values.tolist(),
                    '占比': [f"{(val/len(books_df))*100:.1f}%" for val in category_dist.values]
                })

        # 借阅记录统计
        if 'borrow_records' in data_dict and data_dict['borrow_records'] is not None:
            borrow_df = data_dict['borrow_records']
            summary_data['借阅统计'] = pd.DataFrame({
                '指标': ['借阅记录总数', '已归还比例', '逾期比例', '平均罚款金额', '平均续借次数'],
                '值': [
                    len(borrow_df),
                    f"{(borrow_df['status'] == 'returned').sum() / len(borrow_df) * 100:.1f}%",
                    f"{(borrow_df['status'] == 'overdue').sum() / len(borrow_df) * 100:.1f}%",
                    f"¥{borrow_df['fine_amount'].mean():.2f}",
                    f"{borrow_df['renew_count'].mean():.2f}"
                ]
            })

        # 保存汇总报告
        summary_path = os.path.join(output_dir, 'data_summary.xlsx')
        with pd.ExcelWriter(summary_path, engine='openpyxl') as writer:
            for sheet_name, df in summary_data.items():
                df.to_excel(writer, index=False, sheet_name=sheet_name)

        print(f"  ✓ 已保存: data_summary.xlsx")
        return summary_path

def main():
    """主函数"""
    print("=" * 60)
    print("图书馆管理系统 - 模拟数据生成工具")
    print("=" * 60)

    try:
        # 初始化生成器
        generator = MockDataGenerator(seed=42)

        # 生成数据
        print("\n开始生成模拟数据...")

        # 1. 生成读者数据
        readers_df = generator.generate_readers(count=2000)

        # 2. 生成图书数据
        books_df = generator.generate_books(count=5000)

        # 3. 生成借阅记录
        borrow_df = generator.generate_borrow_records(
            count=10000,
            readers_df=readers_df,
            books_df=books_df
        )

        # 4. 生成预约记录（可选）
        reservations_df = generator.generate_reservations(
            count=500,
            readers_df=readers_df,
            books_df=books_df
        )

        # 5. 生成罚款记录（可选）
        fines_df = generator.generate_fines(
            count=300,
            readers_df=readers_df,
            borrow_df=borrow_df
        )

        print(f"\n数据生成完成！")
        print(f"  读者数据: {len(readers_df)} 条")
        print(f"  图书数据: {len(books_df)} 条")
        print(f"  借阅记录: {len(borrow_df)} 条")
        print(f"  预约记录: {len(reservations_df)} 条")
        print(f"  罚款记录: {len(fines_df)} 条")
        print(f"  总计: {len(readers_df) + len(books_df) + len(borrow_df) + len(reservations_df) + len(fines_df)} 条")

        # 导出为Excel
        data_dict = {
            'readers': readers_df,
            'books': books_df,
            'borrow_records': borrow_df,
            'reservations': reservations_df,
            'fines': fines_df
        }

        excel_files = generator.export_to_excel(data_dict, output_dir='output')

        print(f"\n{'=' * 60}")
        print("生成完成！")
        print(f"Excel文件已保存到 'output' 目录:")
        for file in excel_files:
            print(f"  • {os.path.basename(file)}")
        print(f"\n请查看 'output/data_summary.xlsx' 了解数据统计摘要")
        print("=" * 60)

    except Exception as e:
        print(f"\n错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()