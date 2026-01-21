using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Cassandra.Mapping.Attributes;

namespace CommonLayer.Models
{
    [Table("secret_words")]
    public class SecretWord
    {
        [PartitionKey]
        [Column("word_id")]
        public string Id { get; set; }
        [Column("word")]
        public string Word { get; set; } = null!;
    }
}
