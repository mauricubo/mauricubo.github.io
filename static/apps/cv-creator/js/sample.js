// Fictitious example content. Every name, company and link here is made up.
export const SAMPLE = {
  version: 1,
  template: 'professional',
  accent: '#1F4E79',
  paper: 'a4',
  showFooter: true,
  showPhoto: true,
  contactTitle: 'Contact',
  personal: {
    name: 'Alex Morgan',
    title: 'Senior Cloud Engineer',
    email: 'alex.morgan@example.com',
    phone: '+00 123 456 789',
    location: 'Springfield',
    links: ['linkedin.com/in/example', 'www.example.com'],
    photo: '',
  },
  sections: [
    {
      type: 'text',
      title: 'Profile',
      content:
        'Cloud engineer with 10+ years of experience designing, automating and operating reliable platforms. ' +
        'Led migrations of business-critical workloads to the cloud and built observability practices that cut ' +
        'incident resolution times. Comfortable moving between hands-on engineering and stakeholder conversations.',
    },
    {
      type: 'labeled',
      title: 'Core strengths',
      sidebar: true,
      items: [
        { label: 'Cloud and platforms', text: 'Azure, AWS, Kubernetes, Terraform, Ansible, Docker, Linux.' },
        { label: 'Automation and data', text: 'Python, CI/CD pipelines, monitoring and alerting, log analytics.' },
        { label: 'Leadership', text: 'Mentoring, architecture reviews, technical pre-sales, workshops.' },
      ],
    },
    {
      type: 'entries',
      title: 'Experience',
      items: [
        {
          title: 'Senior Cloud Engineer',
          org: 'Northwind Logistics',
          location: 'Springfield',
          start: '03/2021',
          end: 'Present',
          bullets:
            '**Platform migration:** moved 40+ services to a managed Kubernetes platform with no unplanned downtime.\n' +
            '**Observability:** introduced a central monitoring stack that reduced mean time to resolution by 35%.\n' +
            '**Automation:** replaced manual provisioning with Terraform modules now used by six teams.',
        },
        {
          title: 'DevOps Engineer',
          org: 'Contoso Health',
          location: 'Shelbyville',
          start: '06/2017',
          end: '02/2021',
          bullets:
            'Built CI/CD pipelines for 25 applications, cutting release time from days to hours.\n' +
            'Defined backup and disaster recovery procedures for regulated workloads.',
        },
        {
          title: 'Systems Administrator',
          org: 'Fabrikam Media',
          location: 'Capital City',
          start: '01/2013',
          end: '05/2017',
          bullets:
            'Administered 300+ Linux and Windows servers across two data centres.\n' +
            'Trained junior staff and wrote the team runbook.',
        },
      ],
    },
    {
      type: 'entries',
      title: 'Education',
      items: [
        { title: 'BSc Computer Science', org: 'Example University', location: 'Springfield', start: '2008', end: '2012', bullets: '' },
      ],
    },
    {
      type: 'labeled',
      title: 'Certifications and training',
      sidebar: true,
      items: [
        { label: 'Certifications', text: 'Certified Kubernetes Administrator, Azure Solutions Architect Expert.' },
        { label: 'Courses', text: 'Site Reliability Engineering, Applied Machine Learning.' },
      ],
    },
    {
      type: 'text',
      title: 'Languages',
      sidebar: true,
      content: 'English (native)   |   Spanish (C1)   |   German (B1)',
    },
  ],
};
