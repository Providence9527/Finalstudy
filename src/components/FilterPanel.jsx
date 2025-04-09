import { Autocomplete, TextField, Card, Typography, Box, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

export default function FilterPanel({
  subjects,
  publishers,
  formats,
  tags,
  selectedSubjects,
  selectedPublishers,
  selectedFormats,
  selectedTags,
  onSubjectChange,
  onPublisherChange,
  onFormatChange,
  onTagChange
}) {
  return (
    <Card variant="outlined" sx={{ 
      p: 2.5,
      borderColor: 'grey.300',
      borderRadius: 2,
      boxShadow: 'none',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      '& .MuiAutocomplete-root': { 
        flexShrink: 0,
        '& + .MuiAutocomplete-root': {
          mt: 2
        }
      }
    }}>
      <Typography variant="h6" sx={{ 
        mb: 2.5,
        display: 'flex',
        alignItems: 'center',
        fontSize: '1.125rem',
        fontWeight: 600,
        flexShrink: 0
      }}>
        <FilterListIcon sx={{ mr: 1.5, fontSize: 24 }} />
        筛选条件
      </Typography>

      <Box sx={{ 
        flex: 1,
        //overflow: 'auto',
        pb: 2,
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '3px'
        }
      }}>
        {/* 学科筛选 */}
        <Autocomplete
          multiple
          options={subjects}
          value={selectedSubjects}
          onChange={(e, newValue) => onSubjectChange(newValue)}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="学科" 
              variant="outlined"
              size="small"
              fullWidth
            />
          )}
          ChipProps={{ size: 'small' }}
          renderOption={({ key, ...props }, option) => (
            <li key={key} {...props} style={{ fontSize: '0.875rem' }}>
              {option}
            </li>
          )}
        />

        {/* 出版社筛选 */}
        <Autocomplete
          multiple
          options={publishers}
          value={selectedPublishers}
          onChange={(e, newValue) => onPublisherChange(newValue)}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="出版社" 
              variant="outlined"
              size="small"
              fullWidth
            />
          )}
          sx={{ mt: 2 }}
          ChipProps={{ size: 'small' }}
          renderOption={({ key, ...props }, option) => (
            <li key={key} {...props} style={{ fontSize: '0.875rem' }}>
              {option}
            </li>
          )}
        />

        {/* 文件格式筛选 */}
        <Autocomplete
          multiple
          options={formats}
          value={selectedFormats}
          onChange={(e, newValue) => onFormatChange(newValue)}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="文件格式" 
              variant="outlined"
              size="small"
              fullWidth
            />
          )}
          sx={{ mt: 2 }}
          ChipProps={{ size: 'small' }}
          renderOption={({ key, ...props }, option) => (
            <li key={key} {...props} style={{ fontSize: '0.875rem' }}>
              {option}
            </li>
          )}
        />

        {/* 标签筛选 */}
        <Box sx={{ 
          mt: 3, 
          pt: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          height: 'calc(110vh - 520px)', 
          minHeight: '330px',
          maxHeight: '520px'
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>书籍标签</Typography>
          <Box sx={{ 
            height: '100%',
            overflow: 'auto',
            p: 0.5,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'grey.300'
          }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                color={selectedTags.includes(tag) ? 'primary' : 'default'}
                onClick={() => {
                  const newTags = selectedTags.includes(tag)
                    ? selectedTags.filter(t => t !== tag)
                    : [...selectedTags, tag];
                  onTagChange(newTags);
                }}
                sx={{ 
                  m: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 1
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}