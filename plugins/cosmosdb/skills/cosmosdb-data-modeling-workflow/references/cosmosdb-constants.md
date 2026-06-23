# Azure Cosmos DB NoSQL Constants and Constraints

## Constants for Reference

- **Cosmos DB document limit**: 2MB (hard constraint)
- **Autoscale mode**: Automatically scales between 10% and 100% of max RU/s
- **Request Unit (RU) costs**:
  - Point read (1KB document): 1 RU
  - Query (1KB document): ~2-5 RUs depending on complexity
  - Write (1KB document): ~5 RUs
  - Update (1KB document): ~7 RUs (Update more expensive than create operation)
  - Delete (1KB document): ~5 RUs
  - CRITICAL: Large documents (>10KB) have proportionally higher RU costs
  - Cross-partition query overhead: ~2.5 RU per physical partition scanned
  - Realistic RU estimation: Always calculate based on actual document sizes, not theoretical 1KB
- **Storage**: $0.25/GB-month
- **Throughput**: $0.008/RU per hour (manual), $0.012/RU per hour (autoscale)
- **Monthly seconds**: 2,592,000

## Key Design Constraints

- Document size limit: 2MB (hard limit affecting aggregate boundaries)
- Partition throughput: Up to 10,000 RU/s per physical partition
- Partition key cardinality: Aim for 100+ distinct values to avoid hot partitions (higher the cardinality, the better)
- **Physical partition math**: Total data size / 50GB = number of physical partitions
- Cross-partition queries: Higher RU cost and latency compared to single-partition queries and RU cost per query will increase based on number of physical partitions. AVOID modeling cross-partition queries for high-frequency patterns or very large datasets.
- **Cross-partition overhead**: Each physical partition adds ~2.5 RU base cost to cross-partition queries
- **Massive scale implications**: 100+ physical partitions make cross-partition queries extremely expensive and not scalable.
- Index overhead: Every indexed property consumes storage and write RUs
- Update patterns: Frequent updates to indexed properties or full Document replace increase RU costs (and the bigger Document size, bigger the impact of update RU increase)

## Cost Calculation Accuracy Rules

- **Always calculate RU costs based on realistic document sizes** - not theoretical 1KB examples
- **Include cross-partition overhead** in all cross-partition query costs (2.5 RU x physical partitions)
- **Calculate physical partitions** using total data size / 50GB formula
- **Provide monthly cost estimates** using 2,592,000 seconds/month and current RU pricing
- **Compare total solution costs** when presenting multiple options
- **Double-check all arithmetic** - RU calculation errors lead to wrong recommendations
