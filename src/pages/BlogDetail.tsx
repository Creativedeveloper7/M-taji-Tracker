import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { supabase } from '../lib/supabase'

// Blog post interface (supports both DB and legacy field names)
interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  category: string
  image_url?: string
  image?: string // Legacy field
  author_name?: string
  author?: string // Legacy field
  author_id?: string
  authorRole?: string // Legacy field
  authorAvatar?: string // Legacy field
  published_at?: string
  date?: string // Legacy field
  read_time?: string
  readTime?: string // Legacy field
  tags?: string[]
}

// Kenyan sample blog data with full content
const sampleKenyanBlogs: BlogPost[] = [
  {
    id: 'sample-1',
    title: 'NYOTA Programme: 100,000 Kenyan Youth to Receive KES 50,000 Business Capital',
    excerpt: 'President Ruto launches the National Youth Opportunities Towards Advancement (NYOTA) programme, targeting unemployed youth aged 18-29 with entrepreneurship support and business capital across all 1,450 wards.',
    content: `
      <p class="lead">In a landmark initiative to address youth unemployment, President William Ruto has launched the National Youth Opportunities Towards Advancement (NYOTA) programme, promising to transform the lives of 100,000 young Kenyans with direct business capital.</p>

      <h2>Programme Overview</h2>
      <p>Launched on October 29, 2025, NYOTA represents Kenya's most ambitious youth empowerment initiative to date. Each beneficiary receives KES 50,000 in business capital, with 70 youth selected per ward across all 1,450 wards nationally, ensuring equitable distribution from Turkana to Kwale.</p>

      <h2>Who Qualifies?</h2>
      <p>The programme specifically targets unemployed youth aged 18-29 years who haven't progressed beyond secondary school education. This focus on those without formal academic qualifications recognizes that entrepreneurship skills, not just degrees, can create sustainable livelihoods.</p>

      <blockquote>"This programme is about giving our young people the tools to create their own opportunities. Kenya's future depends on empowering this generation." — President William Ruto</blockquote>

      <h2>Application Process</h2>
      <p>Understanding that internet access remains a challenge for many, NYOTA uses a transparent, digital application system through a free USSD code—no internet required. This inclusive approach ensures that youth in remote areas have equal access to opportunities.</p>

      <h2>Beyond Capital: Comprehensive Support</h2>
      <p>The programme goes beyond just seed funding:</p>
      <ul>
        <li><strong>Apprenticeship opportunities</strong> across various trades</li>
        <li><strong>Entrepreneurship development</strong> and mentorship</li>
        <li><strong>Youth savings schemes</strong> (Haba Haba Scheme)</li>
        <li><strong>AGPO training</strong> for government tender opportunities</li>
        <li><strong>Social enterprise support</strong> for community-focused businesses</li>
      </ul>

      <h2>Building on Success</h2>
      <p>NYOTA builds on the success of previous initiatives like the Kenya Youth Employment and Opportunities Project (KYEOP), which created 125,000 direct jobs and increased youth earnings by 50%. With World Bank funding and government commitment, this five-year initiative aims to create lasting economic transformation.</p>

      <p>For young Kenyans ready to start their entrepreneurial journey, NYOTA represents more than capital—it's a pathway to financial independence and community impact.</p>
    `,
    category: 'Youth',
    image_url: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=1200&auto=format&fit=crop&q=80',
    author_name: 'M-taji Team',
    published_at: '2026-01-20',
    read_time: '6 min read',
    tags: ['Youth', 'NYOTA', 'Entrepreneurship', 'Government']
  },
  {
    id: 'sample-2',
    title: 'Silicon Savannah: How Nairobi Became Africa\'s Tech Innovation Hub',
    excerpt: 'From iHub to Konza Technopolis, explore how Kenya\'s capital has emerged as a global top-60 startup ecosystem, attracting international investors and nurturing homegrown fintech giants.',
    content: `
      <p class="lead">Nairobi has earned its nickname as the "Silicon Savannah"—a vibrant tech ecosystem that has positioned Kenya as Africa's undisputed innovation heartland, ranking in the global top 60 startup ecosystems worldwide.</p>

      <h2>The Origins: iHub and the Pioneer Era</h2>
      <p>It all started with iHub in 2010—a simple co-working space that became the meeting point for Kenya's brightest technologists, designers, and dreamers. From those modest beginnings, an entire ecosystem blossomed, spawning successful startups and attracting global attention.</p>

      <h2>Key Innovation Hubs Today</h2>
      <p>Kenya's tech landscape now features world-class facilities:</p>
      <ul>
        <li><strong>iHub</strong> – The original anchor, now offering structured programmes and corporate partnerships</li>
        <li><strong>Nailab</strong> – Incubator supporting early-stage founders with 3-6 month intensive programmes</li>
        <li><strong>Konza Technopolis</strong> – A smart city 65km from Nairobi with KONZA Cloud and high-speed broadband</li>
        <li><strong>Silicon Savannah Innovation Park</strong> – €35 million University of Nairobi facility for AI, health tech, and green engineering research</li>
      </ul>

      <h2>M-Pesa: The Foundation of Fintech</h2>
      <p>Kenya's tech story cannot be told without M-Pesa. Launched in 2007, this mobile money revolution proved that Africa could leapfrog traditional banking infrastructure. Today, Kenya processes over KES 15 trillion annually through mobile money, and that foundation has spawned hundreds of fintech innovations.</p>

      <blockquote>"Kenya didn't just adopt technology—it created solutions that the world now follows." — Tech Analyst</blockquote>

      <h2>What Makes Kenya Different?</h2>
      <p>Several factors drive Kenya's tech success:</p>
      <ul>
        <li>Strong English language skills enabling global collaboration</li>
        <li>Youthful, tech-savvy population eager to solve local problems</li>
        <li>Government support through tax incentives and the International Financial Center</li>
        <li>Established mobile infrastructure reaching even rural areas</li>
        <li>Growing pool of local and international investors</li>
      </ul>

      <h2>Focus Areas for the Future</h2>
      <p>Beyond fintech, Kenyan startups are making waves in agritech (solving food security), climatetech (addressing environmental challenges), healthtech (improving healthcare access), and AI development. Platforms like M-taji represent the next generation—using technology for transparent, accountable community development.</p>

      <p>For entrepreneurs and investors alike, Kenya's Silicon Savannah offers not just opportunity, but proof that African innovation can compete on the global stage.</p>
    `,
    category: 'Technology',
    image_url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&auto=format&fit=crop&q=80',
    author_name: 'Tech Desk',
    published_at: '2026-01-15',
    read_time: '8 min read',
    tags: ['Technology', 'Nairobi', 'Startups', 'Innovation']
  },
  {
    id: 'sample-3',
    title: 'Maasai Conservancies: How 17,000 Landowners Are Protecting the Mara',
    excerpt: 'The Maasai Mara Wildlife Conservancies model has united 17,304 landowners across 207,586 hectares, creating one of Africa\'s most successful community-led conservation landscapes.',
    content: `
      <p class="lead">In the rolling grasslands of Kenya's Maasai Mara, an extraordinary partnership between Maasai communities and conservation has created one of Africa's most successful models for protecting wildlife while supporting local livelihoods.</p>

      <h2>The Numbers Tell the Story</h2>
      <p>The Maasai Mara Wildlife Conservancies Association (MMWCA) coordinates 24 conservancies spanning <strong>207,586 hectares</strong> (512,947 acres). Behind this vast landscape are <strong>17,304 individual Maasai landowners</strong> who have chosen conservation over subdivision—a remarkable feat of collective action.</p>

      <h2>How It Works</h2>
      <p>The model is elegantly simple: Maasai landowners lease their land to conservancies in exchange for guaranteed monthly payments. Tourism operators pay for access to this pristine wilderness, and those fees flow directly to community members. Additional benefits include:</p>
      <ul>
        <li>Bursary schemes for children's education</li>
        <li>Controlled grass access for livestock</li>
        <li>Credit programmes for emergencies</li>
        <li>Employment in tourism operations</li>
      </ul>

      <blockquote>"Our land, our wildlife, our future. Conservation and Maasai culture can thrive together." — Conservancy Elder</blockquote>

      <h2>Why It Matters for Wildlife</h2>
      <p>The conservancies protect critical migration corridors for the famous wildebeest migration, provide habitat for endangered species like lions, elephants, and cheetahs, and maintain ecological connectivity across the Greater Mara ecosystem. Low-density tourism rules ensure minimal disturbance to wildlife.</p>

      <h2>Women Leading Change</h2>
      <p>A new generation of Maasai women are entering the tourism industry as safari guides—a career path previously closed to them. Carbon-neutral camps are creating employment and educational opportunities while preserving cultural traditions.</p>

      <h2>Major Conservancies</h2>
      <p>The network includes renowned conservancies like Mara North (29,170 ha with 783 landowners), Naboisho (22,500 ha), and Pardamat (25,900 ha). Each operates independently while contributing to the collective goal of ecosystem protection.</p>

      <h2>A Model for Africa</h2>
      <p>The Maasai Mara conservancy model demonstrates that community stewardship can balance ecological integrity with local economic needs. As conservation challenges grow across Africa, this Kenyan success story offers a replicable blueprint for sustainable coexistence.</p>
    `,
    category: 'Community',
    image_url: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=1200&auto=format&fit=crop&q=80',
    author_name: 'Conservation Watch',
    published_at: '2026-01-10',
    read_time: '7 min read',
    tags: ['Conservation', 'Maasai', 'Community', 'Wildlife']
  },
  {
    id: 'sample-4',
    title: 'Village Enterprise: Over 143,000 First-Time Entrepreneurs Trained in Kenya',
    excerpt: 'The poverty graduation programme has launched 44,729 businesses across Kenya, transforming nearly 930,000 lives through entrepreneurship training and seed capital.',
    content: `
      <p class="lead">What does it take to break the cycle of extreme poverty? Village Enterprise has spent decades answering that question, and in Kenya, the results speak for themselves: over 143,700 first-time entrepreneurs trained, 44,729 businesses launched, and nearly 930,000 lives transformed.</p>

      <h2>The Poverty Graduation Model</h2>
      <p>Village Enterprise's approach is deceptively simple but profoundly effective. They identify people living on less than $2 per day and provide them with:</p>
      <ul>
        <li>Business training and mentorship</li>
        <li>Seed capital to start small enterprises</li>
        <li>Savings group membership for financial resilience</li>
        <li>Ongoing support during the critical first year</li>
      </ul>

      <h2>Current Initiatives</h2>
      <p>Today's programmes build on proven success:</p>
      <ul>
        <li><strong>Kenya Social and Economic Inclusion Project (KSEIP)</strong> – Supporting 7,500 households across five counties</li>
        <li><strong>Nawiri Programme in Isiolo County</strong> – Combining poverty graduation with nutrition interventions for 600 vulnerable households</li>
      </ul>

      <blockquote>"I never thought I could own a business. Now I employ two people and my children are in school." — Village Enterprise Graduate, Busia County</blockquote>

      <h2>What Makes It Work?</h2>
      <p>The programme succeeds because it addresses poverty holistically. It's not just about money—it's about building confidence, teaching skills, and creating support networks. Savings groups continue long after formal training ends, providing ongoing financial discipline and community support.</p>

      <h2>Measuring Real Impact</h2>
      <p>Rigorous evaluations have shown that Village Enterprise participants experience sustained income increases, better food security, and improved household resilience to shocks. These aren't temporary gains—they're lasting transformations that ripple through families and communities.</p>

      <h2>Scaling What Works</h2>
      <p>As Kenya's government and international partners look for effective poverty reduction strategies, the Village Enterprise model offers a proven, scalable approach. Every shilling invested returns multiple times in economic activity and reduced dependency on aid.</p>

      <p>For communities across Kenya's western counties, Village Enterprise represents hope made practical—a pathway from survival to thriving.</p>
    `,
    category: 'Impact Stories',
    image_url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200&auto=format&fit=crop&q=80',
    author_name: 'Impact Team',
    published_at: '2026-01-05',
    read_time: '5 min read',
    tags: ['Poverty', 'Entrepreneurship', 'Impact', 'Development']
  },
  {
    id: 'sample-5',
    title: 'Women of Marsabit: Transforming Livelihoods Through Agribusiness',
    excerpt: 'The Manyata Konso Women Group in Marsabit County has built climate resilience through beekeeping, irrigation ponds, and nutritious crop farming with support from Oxfam and NORAD.',
    content: `
      <p class="lead">In the arid landscapes of Marsabit County, where drought is a constant threat and traditional livelihoods are increasingly precarious, a group of determined women are writing a new story of resilience and prosperity.</p>

      <h2>The Manyata Konso Women Group</h2>
      <p>What started as a small savings circle has become a model for climate-smart agriculture in Kenya's northern frontier. With support from Oxfam and funding from the Norwegian Agency for Development Cooperation (NORAD), these women have transformed barren land into productive gardens.</p>

      <h2>Building Water Security</h2>
      <p>Water is life in Marsabit, and the group's first major project addressed this fundamental need. They constructed an irrigation pond that now supports year-round farming—a revolutionary change in an area where agriculture was traditionally limited to rainy seasons.</p>

      <h2>Diversifying Income</h2>
      <p>The women haven't stopped at vegetables. Their initiatives now include:</p>
      <ul>
        <li><strong>Beekeeping</strong> – Honey production provides income and requires minimal water</li>
        <li><strong>Nutritious crops</strong> – Kale, spinach, and other vegetables improve family diets</li>
        <li><strong>Market gardens</strong> – Surplus produce sold at local markets</li>
        <li><strong>Seed multiplication</strong> – Ensuring future planting material</li>
      </ul>

      <blockquote>"Before, we depended on our husbands for everything. Now we have our own money, our own decisions, our own future." — Group Chairlady</blockquote>

      <h2>Financial Empowerment</h2>
      <p>Beyond farming, the women received training in financial management. They now operate a table banking system, providing small loans to members for education, healthcare, and business expansion. This financial independence has transformed household dynamics and elevated women's status in their communities.</p>

      <h2>Climate Resilience</h2>
      <p>Perhaps most importantly, the group has become more resilient to climate shocks. When drought strikes—as it inevitably does—they have diversified income sources, stored food, and financial reserves to weather the crisis without falling back into poverty.</p>

      <h2>A Model for Northern Kenya</h2>
      <p>The Manyata Konso Women Group proves that with the right support, communities in even the harshest environments can build sustainable livelihoods. Their success is being replicated across Marsabit and neighbouring counties, offering hope for thousands of women facing similar challenges.</p>
    `,
    category: 'Impact Stories',
    image_url: 'https://images.unsplash.com/photo-1594708767771-a7502f9c8cc1?w=1200&auto=format&fit=crop&q=80',
    author_name: 'Community Stories',
    published_at: '2025-12-28',
    read_time: '6 min read',
    tags: ['Women', 'Agriculture', 'Climate', 'Marsabit']
  },
  {
    id: 'sample-6',
    title: 'M-Shamba & Digital Agriculture: 1.1 Million Kenyan Farmers Connected',
    excerpt: 'The Kenya Agricultural Observatory Platform and mobile apps like M-Shamba are revolutionizing farming with real-time weather data, agronomic advice, and market linkages.',
    content: `
      <p class="lead">Kenya is witnessing an agricultural revolution—not in the fields, but in the palms of farmers' hands. Digital platforms are connecting over 1.1 million smallholder farmers to information and markets that were previously out of reach.</p>

      <h2>The Kenya Agricultural Observatory Platform (KAOP)</h2>
      <p>Supported by the World Bank, KAOP represents the most ambitious effort to digitize Kenyan agriculture. The platform links farmers to big data systems providing:</p>
      <ul>
        <li>Geospatial agro-meteorological data</li>
        <li>Customized agronomic advice based on location and crop</li>
        <li>Early warning systems for pests and diseases</li>
        <li>Market price information</li>
      </ul>

      <h2>M-Shamba: Extension Services in Your Pocket</h2>
      <p>M-Shamba uses interactive voice response (IVR), SMS, and mobile apps to deliver agricultural knowledge directly to farmers. The results have been remarkable—one banana farmer in Central Kenya increased sales from 7.2 to 18 metric tons annually after adopting M-Shamba's recommendations.</p>

      <blockquote>"I used to guess when to plant, when to spray, when to harvest. Now I know." — M-Shamba User, Murang'a County</blockquote>

      <h2>95 Digital Agriculture Services</h2>
      <p>Kenya now offers 95 digital agriculture services—nearly double other African countries like Nigeria. These fall into three main categories:</p>
      <ul>
        <li><strong>Last-mile digitization</strong> – Replacing manual processes with mobile transactions</li>
        <li><strong>Market linkage platforms</strong> – Twiga Foods, Mkulima Young, Mfarm connecting farmers to buyers</li>
        <li><strong>Direct-to-farmer hubs</strong> – Integrated services for inputs, information, and finance</li>
      </ul>

      <h2>Financial Inclusion Through Data</h2>
      <p>Digital platforms are generating valuable data on farmer creditworthiness. Companies like Twiga Foods and Tulaa share transaction histories with financial institutions, enabling farmers to access loans for the first time. This data-driven lending is unlocking capital that banks previously considered too risky.</p>

      <h2>Challenges Remain</h2>
      <p>Despite progress, only 20-30% of Kenyan farmers have adopted digital tools. Rural internet penetration remains at 32.7%, and data costs can be prohibitive. Bridging this digital divide is essential for the next wave of agricultural transformation.</p>

      <h2>The Future of Kenyan Farming</h2>
      <p>As connectivity improves and digital literacy grows, the potential is enormous. Smart farming—precision agriculture, automated irrigation, drone monitoring—is already emerging in commercial operations. The question is how quickly these technologies can reach the millions of smallholders who form the backbone of Kenya's food system.</p>
    `,
    category: 'Technology',
    image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&auto=format&fit=crop&q=80',
    author_name: 'AgriTech Kenya',
    published_at: '2025-12-20',
    read_time: '7 min read',
    tags: ['AgriTech', 'Digital', 'Farmers', 'Innovation']
  },
  {
    id: '1',
    title: 'How Community Initiatives Are Transforming Kenya',
    excerpt: 'Discover how grassroots movements and community-driven projects are creating lasting change across Kenyan communities, from urban centers to rural villages.',
    content: `
      <p class="lead">Across Kenya, a quiet revolution is taking place. Community-driven initiatives are reshaping the landscape of development, proving that sustainable change starts from the ground up.</p>

      <h2>The Power of Local Leadership</h2>
      <p>When communities take ownership of their development projects, the results speak for themselves. From water harvesting projects in Turkana to youth empowerment programs in Nairobi's informal settlements, local leaders are demonstrating that they understand their communities' needs better than anyone else.</p>

      <p>Take the story of Wanjiku Mwangi, a community organizer in Kiambu County. Starting with just 15 women in her savings group, she has helped transform her village's approach to agriculture. Today, over 200 families participate in the cooperative farming initiative she founded, increasing their household incomes by an average of 40%.</p>

      <h2>Technology Enabling Transparency</h2>
      <p>One of the most significant shifts in community development has been the adoption of technology for tracking and accountability. Platforms like M-taji are enabling donors, government agencies, and community members to see exactly where funds are going and what impact they're having.</p>

      <blockquote>"When people can see their contributions making a real difference, they're more likely to stay engaged and continue supporting initiatives." — Development Expert</blockquote>

      <h2>Challenges and Opportunities</h2>
      <p>Despite the progress, challenges remain. Many communities still lack access to basic infrastructure, and bureaucratic hurdles can slow down even the most well-intentioned projects. However, the growing ecosystem of support organizations, improved mobile connectivity, and increasing government buy-in are creating unprecedented opportunities for scale.</p>

      <h2>Looking Forward</h2>
      <p>The future of community development in Kenya looks bright. As more success stories emerge and best practices are shared, the model of community-led development is gaining recognition not just nationally, but across the African continent and beyond.</p>

      <p>For those looking to get involved, the opportunities are endless. Whether you're a potential donor, a skilled professional looking to volunteer, or a community member with an idea for positive change, platforms like M-taji make it easier than ever to connect, contribute, and create impact.</p>
    `,
    category: 'Impact Stories',
    image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80',
    author_name: 'M-taji Team',
    published_at: '2026-01-28',
    read_time: '5 min read',
    tags: ['Community', 'Development', 'Kenya', 'Impact']
  },
  {
    id: '2',
    title: 'The Power of Transparent Funding in Development Projects',
    excerpt: 'Learn why transparency in funding allocation is crucial for the success of development initiatives and how M-taji enables real-time tracking.',
    content: `
      <p class="lead">In the world of development funding, transparency isn't just a nice-to-have—it's essential for building trust, ensuring accountability, and maximizing impact.</p>

      <h2>Why Transparency Matters</h2>
      <p>For decades, development funding has suffered from a lack of visibility. Donors often had little insight into how their contributions were being used, and communities rarely had a voice in how funds were allocated. This opacity led to inefficiencies, misallocation, and in some cases, outright corruption.</p>

      <p>Transparent funding changes this dynamic entirely. When every transaction is visible, when progress can be tracked in real-time, and when communities can hold implementers accountable, the entire system becomes more efficient and effective.</p>

      <h2>Real-Time Tracking Technology</h2>
      <p>Modern technology has made transparent funding not just possible, but practical. Blockchain-based ledgers, satellite monitoring, and mobile reporting tools allow stakeholders at every level to see exactly what's happening with development funds.</p>

      <p>M-taji leverages these technologies to provide:</p>
      <ul>
        <li>Real-time budget tracking and expenditure reporting</li>
        <li>Satellite-based verification of physical progress</li>
        <li>Community feedback mechanisms</li>
        <li>Automated milestone tracking</li>
      </ul>

      <h2>Benefits for All Stakeholders</h2>
      <p><strong>For Donors:</strong> Confidence that their contributions are being used as intended, with clear evidence of impact.</p>
      <p><strong>For Implementers:</strong> Reduced reporting burden, easier access to funding, and protection against false accusations.</p>
      <p><strong>For Communities:</strong> A voice in how development happens, and assurance that promised benefits will be delivered.</p>
      <p><strong>For Governments:</strong> Better oversight capabilities and improved public trust in development spending.</p>

      <h2>The Future of Development Finance</h2>
      <p>As more organizations adopt transparent funding practices, we're seeing a fundamental shift in how development is financed. Impact investors, government agencies, and individual donors are increasingly demanding transparency as a prerequisite for engagement.</p>

      <p>This shift promises to accelerate progress toward development goals while reducing waste and building the trust that sustainable development requires.</p>
    `,
    category: 'Transparency',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&auto=format&fit=crop&q=80',
    author: 'Finance Team',
    authorRole: 'Financial Analysis',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    date: '2026-01-25',
    readTime: '7 min read',
    tags: ['Transparency', 'Funding', 'Technology', 'Accountability']
  },
  {
    id: '3',
    title: 'Satellite Monitoring: A New Era of Project Verification',
    excerpt: 'Explore how satellite imagery and remote sensing technology are revolutionizing how we verify and track physical progress of development projects.',
    content: `
      <p class="lead">Satellite technology is transforming how we monitor and verify development projects, offering unprecedented visibility into physical progress across even the most remote locations.</p>

      <h2>The Challenge of Verification</h2>
      <p>Historically, verifying the physical progress of development projects required expensive site visits, which were often infrequent and could be manipulated. This created opportunities for misreporting and made it difficult for stakeholders to have confidence in project updates.</p>

      <h2>How Satellite Monitoring Works</h2>
      <p>Modern satellite imagery provides regular, objective snapshots of project sites. Using high-resolution imagery from providers like Sentinel-2, Planet Labs, and Maxar, we can track changes over time with remarkable precision.</p>

      <p>The process involves:</p>
      <ul>
        <li>Capturing baseline imagery when a project begins</li>
        <li>Regular captures at defined intervals (weekly, monthly, or quarterly)</li>
        <li>AI-assisted analysis to detect and measure changes</li>
        <li>Comparison with reported milestones and timelines</li>
      </ul>

      <h2>Real-World Applications</h2>
      <p><strong>Construction Projects:</strong> Track building progress from foundation to completion, verify that structures match approved plans.</p>
      <p><strong>Agricultural Initiatives:</strong> Monitor crop coverage, irrigation systems, and land use changes.</p>
      <p><strong>Environmental Projects:</strong> Verify reforestation efforts, track watershed management, monitor conservation areas.</p>
      <p><strong>Infrastructure:</strong> Road construction, water systems, and utility installations can all be verified from space.</p>

      <h2>Limitations and Considerations</h2>
      <p>While powerful, satellite monitoring isn't perfect. Cloud cover can obscure imagery, resolution limits detail in smaller projects, and some types of progress (like interior building work) can't be seen from above. That's why M-taji combines satellite data with other verification methods for comprehensive monitoring.</p>

      <h2>The Future of Remote Monitoring</h2>
      <p>As satellite technology improves and costs decrease, we expect satellite monitoring to become standard practice in development. Combined with drone imagery, IoT sensors, and community reporting, we're moving toward a future where project verification is continuous, objective, and trustworthy.</p>
    `,
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80',
    author: 'Tech Team',
    authorRole: 'Technology',
    authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60',
    date: '2026-01-20',
    readTime: '6 min read',
    tags: ['Satellite', 'Technology', 'Monitoring', 'Verification']
  },
  {
    id: '4',
    title: 'Empowering Youth Through Skills Development Programs',
    excerpt: 'How M-taji partner organizations are creating employment opportunities and building skills for the next generation of Kenyan leaders.',
    content: `
      <p class="lead">Kenya's youth represent both its greatest challenge and its greatest opportunity. With the right skills and opportunities, young Kenyans are proving they can drive innovation, create employment, and transform their communities.</p>

      <h2>The Youth Employment Challenge</h2>
      <p>With over 75% of Kenya's population under 35, youth unemployment is one of the country's most pressing issues. Traditional job markets can't absorb the millions of young people entering the workforce each year, creating urgent need for new approaches to skills development and job creation.</p>

      <h2>Skills for the Future</h2>
      <p>M-taji partner organizations are focusing on skills that match market demand:</p>
      <ul>
        <li><strong>Digital Skills:</strong> Coding, digital marketing, data analysis</li>
        <li><strong>Technical Trades:</strong> Solar installation, modern agriculture, construction</li>
        <li><strong>Entrepreneurship:</strong> Business planning, financial management, marketing</li>
        <li><strong>Soft Skills:</strong> Communication, teamwork, problem-solving</li>
      </ul>

      <h2>Success Stories</h2>
      <p>The Talanta Sports Initiative in Kasarani has trained over 500 young athletes in sports management and coaching, with 70% now earning income from sports-related activities. Meanwhile, the Digital Skills Academy in Mombasa has graduated 1,200 students, with 85% finding employment within six months.</p>

      <blockquote>"I never thought I could make a living from my passion for sports. Now I'm coaching the next generation and earning more than I ever dreamed possible." — Graduate, Talanta Sports Initiative</blockquote>

      <h2>The Role of Technology</h2>
      <p>Technology is making skills development more accessible than ever. Online learning platforms, mobile-first curricula, and virtual mentorship programs are reaching young people in even the most remote areas. M-taji tracks these programs' outcomes, ensuring that training translates into real employment and income.</p>

      <h2>Creating an Ecosystem</h2>
      <p>Skills alone aren't enough. Successful programs also connect graduates with employers, provide startup capital for entrepreneurs, and offer ongoing mentorship. This ecosystem approach ensures that skills development leads to sustainable livelihoods.</p>
    `,
    category: 'Youth',
    image: 'https://images.unsplash.com/photo-1529390079861-591f83a87bce?w=1200&auto=format&fit=crop&q=80',
    author: 'Community Team',
    authorRole: 'Community Development',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60',
    date: '2026-01-15',
    readTime: '4 min read',
    tags: ['Youth', 'Skills', 'Employment', 'Education']
  },
  {
    id: '5',
    title: 'From Idea to Impact: Starting Your Own Initiative',
    excerpt: 'A comprehensive guide for aspiring changemakers on how to turn their community improvement ideas into funded, trackable initiatives.',
    content: `
      <p class="lead">Every great initiative starts with an idea. This guide will walk you through the process of turning your vision for community improvement into a funded, trackable project on M-taji.</p>

      <h2>Step 1: Define Your Vision</h2>
      <p>Start by clearly articulating what you want to achieve. Ask yourself:</p>
      <ul>
        <li>What problem am I trying to solve?</li>
        <li>Who will benefit from this initiative?</li>
        <li>What does success look like?</li>
        <li>How will I measure impact?</li>
      </ul>

      <h2>Step 2: Research and Validate</h2>
      <p>Before launching, ensure your idea addresses a real need. Talk to community members, research existing solutions, and identify what makes your approach different or better. This validation will strengthen your proposal and increase your chances of success.</p>

      <h2>Step 3: Build Your Team</h2>
      <p>No one creates impact alone. Identify partners, advisors, and team members who bring complementary skills. Consider:</p>
      <ul>
        <li>Technical expertise relevant to your project</li>
        <li>Community connections and trust</li>
        <li>Financial management experience</li>
        <li>Marketing and communication skills</li>
      </ul>

      <h2>Step 4: Create a Detailed Plan</h2>
      <p>A strong plan includes:</p>
      <ul>
        <li><strong>Timeline:</strong> Realistic milestones and deadlines</li>
        <li><strong>Budget:</strong> Detailed costs with contingencies</li>
        <li><strong>Metrics:</strong> How you'll measure and report progress</li>
        <li><strong>Risks:</strong> Potential challenges and mitigation strategies</li>
      </ul>

      <h2>Step 5: Register on M-taji</h2>
      <p>Create your organization profile, submit your initiative details, and set up your tracking parameters. Our team will review your submission and provide feedback to strengthen your proposal.</p>

      <h2>Step 6: Launch and Iterate</h2>
      <p>Once approved, launch your initiative and start tracking progress. Be prepared to learn and adapt as you go. The most successful initiatives are those that respond to feedback and continuously improve.</p>

      <h2>Resources to Help You Succeed</h2>
      <p>M-taji offers resources for initiative creators, including template documents, mentorship connections, and a community of fellow changemakers. Don't hesitate to reach out for support.</p>
    `,
    category: 'Guide',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&auto=format&fit=crop&q=80',
    author: 'M-taji Team',
    authorRole: 'Editorial',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60',
    date: '2026-01-10',
    readTime: '8 min read',
    tags: ['Guide', 'Startup', 'Initiative', 'How-to']
  },
  {
    id: '6',
    title: 'Government Partnerships: Building Trust Through Data',
    excerpt: 'How government entities are leveraging M-taji to demonstrate accountability and build public trust in development spending.',
    content: `
      <p class="lead">Government development spending has long been viewed with skepticism by citizens. M-taji is helping government entities rebuild trust by providing unprecedented transparency into how public funds are used.</p>

      <h2>The Trust Deficit</h2>
      <p>Surveys consistently show that citizens have low trust in government spending. Concerns about corruption, inefficiency, and misallocation of resources have created a perception gap between what governments say they're doing and what citizens believe is actually happening.</p>

      <h2>A New Approach</h2>
      <p>Progressive government entities are embracing transparency as a solution. By publishing detailed project information, real-time budget tracking, and independent verification data, they're giving citizens the tools to see for themselves what's being accomplished.</p>

      <h2>How It Works</h2>
      <p>Government partners on M-taji commit to:</p>
      <ul>
        <li>Publishing all project budgets and expenditures</li>
        <li>Regular progress updates with photographic evidence</li>
        <li>Independent satellite verification of physical works</li>
        <li>Community feedback integration</li>
        <li>Third-party audits and assessments</li>
      </ul>

      <h2>Case Study: County Infrastructure Program</h2>
      <p>One county government used M-taji to track its road improvement program. By publishing real-time updates and inviting citizen feedback, they saw public approval ratings for infrastructure spending increase by 35% over 18 months. Contractors, knowing their work was being monitored, delivered projects on time and to specification.</p>

      <h2>Benefits Beyond Trust</h2>
      <p>Transparency doesn't just build trust—it improves outcomes. Government partners report:</p>
      <ul>
        <li>Reduced cost overruns</li>
        <li>Faster project completion</li>
        <li>Better contractor performance</li>
        <li>Increased citizen engagement</li>
        <li>More effective resource allocation</li>
      </ul>

      <h2>The Path Forward</h2>
      <p>As more government entities demonstrate the value of transparency, we expect to see broader adoption. The goal is a future where transparent, trackable development spending is the norm rather than the exception—and where citizens have full confidence in how their tax shillings are being used.</p>
    `,
    category: 'Government',
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80',
    author: 'Policy Team',
    authorRole: 'Government Relations',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
    date: '2026-01-05',
    readTime: '5 min read',
    tags: ['Government', 'Transparency', 'Trust', 'Policy']
  }
]

// Category colors
const categoryColors: Record<string, string> = {
  'Impact Stories': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Transparency': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Technology': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Youth': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Guide': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Government': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Community': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'News': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
}

// Function to format blog content - handles both HTML and plain text
const formatBlogContent = (content: string): string => {
  if (!content) return '';
  
  // Check if content already has HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
  
  if (hasHtmlTags) {
    // Content already has HTML, return as is
    return content;
  }
  
  // Convert plain text to HTML with proper paragraph spacing
  // Split by double newlines (paragraph breaks) or single newlines
  const paragraphs = content
    .split(/\n\n+/) // Split by double newlines
    .map(para => para.trim())
    .filter(para => para.length > 0);
  
  // If only one paragraph with single newlines, split those too
  if (paragraphs.length === 1 && content.includes('\n')) {
    const lines = content
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    return lines.map(line => `<p>${line}</p>`).join('\n');
  }
  
  // Wrap each paragraph in <p> tags
  return paragraphs.map(para => {
    // Check if this looks like a heading (short line, possibly ending with punctuation)
    if (para.length < 80 && !para.includes('.') && para === para.toUpperCase()) {
      return `<h2>${para}</h2>`;
    }
    // Handle lines that might be bullet points
    if (para.startsWith('- ') || para.startsWith('• ')) {
      const items = para.split(/\n/).filter(item => item.trim());
      return `<ul>${items.map(item => `<li>${item.replace(/^[-•]\s*/, '')}</li>`).join('')}</ul>`;
    }
    return `<p>${para}</p>`;
  }).join('\n\n');
}

// Comment interface
interface BlogComment {
  id: string;
  blog_id: string;
  commenter_name: string;
  comment: string;
  created_at: string;
}

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  
  // Comments state
  const [comments, setComments] = useState<BlogComment[]>([])
  const [commenterName, setCommenterName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentSuccess, setCommentSuccess] = useState(false)

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return

      try {
        setLoading(true)
        
        // First try to fetch from database
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', id)
          .eq('status', 'published')
          .single()

        if (error || !data) {
          // Fallback to sample Kenyan blogs
          const sampleBlog = sampleKenyanBlogs.find(b => b.id === id)
          if (sampleBlog) {
            setBlog(sampleBlog)
            const related = sampleKenyanBlogs
              .filter(b => b.id !== id && b.category === sampleBlog.category)
              .slice(0, 3)
            setRelatedPosts(related)
          }
        } else {
          // Map database fields to component fields
          setBlog({
            ...data,
            image_url: data.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80',
            tags: data.tags || [],
          })

          // Fetch related posts from database
          const { data: relatedData } = await supabase
            .from('blogs')
            .select('id, title, category, image_url, read_time')
            .eq('status', 'published')
            .eq('category', data.category)
            .neq('id', id)
            .limit(3)

          if (relatedData) {
            setRelatedPosts(relatedData as BlogPost[])
          }
        }
      } catch (err) {
        console.error('Error fetching blog:', err)
        // Fallback to sample Kenyan blogs
        const sampleBlog = sampleKenyanBlogs.find(b => b.id === id)
        if (sampleBlog) {
          setBlog(sampleBlog)
          const related = sampleKenyanBlogs
            .filter(b => b.id !== id && b.category === sampleBlog.category)
            .slice(0, 3)
          setRelatedPosts(related)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBlog()
  }, [id])

  // Fetch comments for this blog
  useEffect(() => {
    const fetchComments = async () => {
      if (!id || id.startsWith('sample-')) return; // Skip for sample blogs

      try {
        const { data, error } = await supabase
          .from('blog_comments')
          .select('*')
          .eq('blog_id', id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setComments(data);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    };

    fetchComments();
  }, [id]);

  // Submit a new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || id.startsWith('sample-')) {
      setCommentError('Comments are not available for sample blogs');
      return;
    }

    if (!commenterName.trim()) {
      setCommentError('Please enter your name');
      return;
    }

    if (!commentText.trim()) {
      setCommentError('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      setCommentError(null);

      const { data, error } = await supabase
        .from('blog_comments')
        .insert([{
          blog_id: id,
          commenter_name: commenterName.trim(),
          comment: commentText.trim(),
          is_approved: true, // Auto-approve for now
        }])
        .select()
        .single();

      if (error) throw error;

      // Add the new comment to the list
      if (data) {
        setComments(prev => [data, ...prev]);
      }

      // Reset form
      setCommenterName('');
      setCommentText('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error submitting comment:', err);
      setCommentError('Failed to submit comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mtaji-accent"></div>
        </div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-primary">
        <Header />
        <div className="pt-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center py-20">
            <h1 className="text-3xl font-bold text-primary mb-4">Article Not Found</h1>
            <p className="text-secondary mb-8">The article you're looking for doesn't exist or has been removed.</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-mtaji-accent text-white rounded-lg hover:bg-mtaji-accent/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary">
      <Header />

      {/* Hero Image */}
      <div className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] mt-16">
        <img
          src={blog.image_url || blog.image || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80'}
          alt={blog.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/blog')}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-lg hover:bg-white/30 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16">
          <div className="max-w-4xl mx-auto">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${categoryColors[blog.category] || 'bg-gray-100 text-gray-800'}`}>
              {blog.category}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                {blog.authorAvatar ? (
                  <img
                    src={blog.authorAvatar}
                    alt={blog.author_name || blog.author || 'Author'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-mtaji-accent/30 flex items-center justify-center border-2 border-white/30">
                    <span className="text-white font-semibold">
                      {(blog.author_name || blog.author || 'A').charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{blog.author_name || blog.author || 'Anonymous'}</p>
                  <p className="text-sm text-white/70">{blog.authorRole || 'Author'}</p>
                </div>
              </div>
              <span className="hidden sm:block">•</span>
              <span>{(blog.published_at || blog.date) ? new Date(blog.published_at || blog.date!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft'}</span>
              <span>•</span>
              <span>{blog.read_time || blog.readTime || '5 min read'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Excerpt / Lead paragraph */}
          {blog.excerpt && (
            <p className="text-xl text-secondary font-medium mb-8 leading-relaxed border-l-4 border-mtaji-accent pl-6">
              {blog.excerpt}
            </p>
          )}

          {/* Article Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:text-primary prose-headings:font-bold
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-p:text-secondary prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-mtaji-accent prose-a:no-underline hover:prose-a:underline
              prose-strong:text-primary prose-strong:font-semibold
              prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
              prose-li:text-secondary prose-li:mb-2
              prose-blockquote:border-l-4 prose-blockquote:border-mtaji-accent prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-secondary prose-blockquote:my-8
              [&_.lead]:text-xl [&_.lead]:text-secondary [&_.lead]:font-medium [&_.lead]:mb-8"
            dangerouslySetInnerHTML={{ __html: formatBlogContent(blog.content) }}
          />

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-subtle">
              <h3 className="text-sm font-semibold text-secondary mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {blog.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-secondary text-secondary text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div className="mt-8 pt-8 border-t border-subtle">
            <h3 className="text-sm font-semibold text-secondary mb-4">Share this article</h3>
            <div className="flex gap-3">
              <button className="p-3 bg-secondary rounded-full hover:bg-mtaji-accent hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </button>
              <button className="p-3 bg-secondary rounded-full hover:bg-mtaji-accent hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </button>
              <button className="p-3 bg-secondary rounded-full hover:bg-mtaji-accent hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Link copied to clipboard!')
                }}
                className="p-3 bg-secondary rounded-full hover:bg-mtaji-accent hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Author Card */}
          <div className="mt-12 p-6 bg-secondary rounded-xl">
            <div className="flex items-start gap-4">
              {blog.authorAvatar ? (
                <img
                  src={blog.authorAvatar}
                  alt={blog.author_name || blog.author || 'Author'}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-mtaji-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-mtaji-accent">
                    {(blog.author_name || blog.author || 'A').charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-primary">{blog.author_name || blog.author || 'Anonymous'}</h3>
                <p className="text-sm text-secondary mb-2">{blog.authorRole || 'Author'}</p>
                <p className="text-secondary text-sm">
                  Contributing to M-taji's mission of transparent, trackable development through insightful content and analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-12 pt-8 border-t border-subtle">
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            {!id?.startsWith('sample-') ? (
              <form onSubmit={handleSubmitComment} className="mb-8 p-6 bg-secondary rounded-xl">
                <h4 className="font-semibold text-primary mb-4">Leave a Comment</h4>
                
                {commentSuccess && (
                  <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-lg text-sm">
                    Comment posted successfully!
                  </div>
                )}
                
                {commentError && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-lg text-sm">
                    {commentError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Your Name</label>
                    <input
                      type="text"
                      value={commenterName}
                      onChange={(e) => setCommenterName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 bg-primary border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-mtaji-accent"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Your Comment</label>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={4}
                      className="w-full px-4 py-2 bg-primary border border-subtle rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-mtaji-accent resize-none"
                      maxLength={1000}
                    />
                    <p className="text-xs text-secondary mt-1">{commentText.length}/1000 characters</p>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="px-6 py-2 bg-mtaji-accent text-white rounded-lg font-medium hover:bg-mtaji-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="mb-8 p-4 bg-secondary rounded-lg text-secondary text-sm">
                Comments are available on published blog posts from our community authors.
              </p>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-secondary rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-mtaji-accent/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-mtaji-accent">
                          {comment.commenter_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primary">{comment.commenter_name}</span>
                          <span className="text-xs text-secondary">
                            {new Date(comment.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-secondary text-sm whitespace-pre-wrap">{comment.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !id?.startsWith('sample-') && (
                <p className="text-secondary text-center py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )
            )}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-secondary/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-primary mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(post => (
                <Link
                  key={post.id}
                  to={`/blog/${post.id}`}
                  className="bg-secondary rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all group"
                >
                  <div className="h-40 overflow-hidden">
                    <img
                      src={post.image_url || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60'}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mb-2 ${categoryColors[post.category] || 'bg-gray-100 text-gray-800'}`}>
                      {post.category}
                    </span>
                    <h3 className="font-bold text-primary line-clamp-2 group-hover:text-mtaji-accent transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-secondary mt-2">{post.read_time || '5 min read'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-secondary border-t border-subtle">
        <div className="max-w-7xl mx-auto text-center text-secondary text-sm">
          <p>&copy; {new Date().getFullYear()} M-taji. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default BlogDetail
